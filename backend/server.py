from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
from io import BytesIO
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'slc-secret-key-2024-livestock-care')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Smart Livestock Care API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ ENUMS ============
class UserRole(str, Enum):
    FARMER = "farmer"
    PARAVET = "paravet"
    VETERINARIAN = "veterinarian"
    ADMIN = "admin"
    GUEST = "guest"

class Species(str, Enum):
    CATTLE = "cattle"
    BUFFALO = "buffalo"
    SHEEP = "sheep"
    GOAT = "goat"
    PIG = "pig"
    POULTRY = "poultry"
    DOG = "dog"
    CAT = "cat"
    HORSE = "horse"
    DONKEY = "donkey"
    CAMEL = "camel"

class TestCategory(str, Enum):
    BLOOD = "blood"
    DUNG = "dung"
    MILK = "milk"
    URINE = "urine"
    NASAL = "nasal"
    SKIN = "skin"

class InterpretationStatus(str, Enum):
    NORMAL = "normal"
    HIGH = "high"
    LOW = "low"
    POSITIVE = "positive"
    NEGATIVE = "negative"

class CaseResult(str, Enum):
    RECOVERED = "recovered"
    REFERRED = "referred"
    DIED = "died"
    ONGOING = "ongoing"
    FOLLOWUP = "followup"

class CaseType(str, Enum):
    OPD = "opd"
    IPD = "ipd"

# High-risk zoonotic diseases
HIGH_RISK_DISEASES = [
    "Brucellosis", "Anthrax", "Leptospirosis", "Tuberculosis",
    "Avian Influenza", "Rabies", "FMD"
]

# ============ PYDANTIC MODELS ============

# User Models
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    phone: str
    email: Optional[str] = None
    role: UserRole
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str
    role: UserRole

class UserResponse(UserBase):
    id: str
    created_at: str
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Animal Models
class AnimalBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tag_id: str
    species: Species
    breed: str
    age_months: int
    gender: str
    status: str = "healthy"
    color: Optional[str] = None
    weight_kg: Optional[float] = None
    notes: Optional[str] = None

class AnimalCreate(AnimalBase):
    pass

class AnimalResponse(AnimalBase):
    id: str
    farmer_id: str
    created_at: str
    updated_at: str

# Vaccination Models
class VaccinationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    animal_id: str
    vaccine_name: str
    batch_number: Optional[str] = None
    dose: str
    administered_by: Optional[str] = None
    next_due_date: Optional[str] = None
    remarks: Optional[str] = None

class VaccinationCreate(VaccinationBase):
    pass

class VaccinationResponse(VaccinationBase):
    id: str
    farmer_id: str
    date: str
    created_at: str

# Deworming Models
class DewormingBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    animal_id: str
    drug_name: str
    dose: str
    administered_by: Optional[str] = None
    next_due_date: Optional[str] = None
    remarks: Optional[str] = None

class DewormingCreate(DewormingBase):
    pass

class DewormingResponse(DewormingBase):
    id: str
    farmer_id: str
    date: str
    created_at: str

# Breeding/AI Models
class BreedingBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    animal_id: str
    breeding_type: str  # natural, AI
    sire_details: Optional[str] = None
    semen_batch: Optional[str] = None
    inseminator: Optional[str] = None
    expected_calving: Optional[str] = None
    remarks: Optional[str] = None

class BreedingCreate(BreedingBase):
    pass

class BreedingResponse(BreedingBase):
    id: str
    farmer_id: str
    date: str
    created_at: str

# Diagnostic Test Models
class DiagnosticTestBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    animal_id: str
    test_category: TestCategory
    test_type: str
    species: Species
    value: Optional[float] = None
    value_text: Optional[str] = None  # For positive/negative
    unit: Optional[str] = None
    symptoms: List[str] = []
    notes: Optional[str] = None

class DiagnosticTestCreate(DiagnosticTestBase):
    pass

class DiagnosticInterpretation(BaseModel):
    status: InterpretationStatus
    normal_range: Optional[str] = None
    possible_conditions: List[str] = []
    special_symptoms: List[str] = []
    suggested_actions: List[str] = []
    safety_alert: Optional[Dict[str, Any]] = None

class DiagnosticTestResponse(DiagnosticTestBase):
    id: str
    vet_id: str
    interpretation: Optional[DiagnosticInterpretation] = None
    date: str
    created_at: str

# Knowledge Center Models
class ReferenceData(BaseModel):
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    unit: Optional[str] = None
    increase_causes: List[str] = []
    decrease_causes: List[str] = []
    special_symptoms: List[str] = []
    suggested_actions: List[str] = []
    notes: Optional[str] = None

class KnowledgeCenterEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    test_category: TestCategory
    test_type: str
    species: Species
    reference_data: ReferenceData

class KnowledgeCenterResponse(KnowledgeCenterEntry):
    id: str
    created_at: str
    updated_at: str

# Safety Alert Model
class SafetyAlert(BaseModel):
    disease: str
    ppe_requirements: List[str]
    handling_precautions: List[str]
    sample_collection_safety: List[str]
    waste_disposal: List[str]
    public_health_advice: str
    reporting_requirements: str
    legal_disclaimer: str

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[UserRole]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in [r.value for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

def get_safety_alert(disease: str) -> Optional[SafetyAlert]:
    """Get safety alert for high-risk diseases"""
    if disease not in HIGH_RISK_DISEASES:
        return None
    
    return SafetyAlert(
        disease=disease,
        ppe_requirements=[
            "Wear disposable gloves",
            "Use N95 mask or respirator",
            "Wear protective eyewear",
            "Use disposable gown/coverall",
            "Rubber boots with disinfection"
        ],
        handling_precautions=[
            "Minimize direct animal contact",
            "Avoid contact with body fluids",
            "Work in well-ventilated areas",
            "Wash hands thoroughly after handling",
            "Do not eat/drink in work areas"
        ],
        sample_collection_safety=[
            "Use sterile equipment",
            "Label samples clearly as biohazard",
            "Double-bag specimens",
            "Transport in leak-proof containers",
            "Follow cold chain if required"
        ],
        waste_disposal=[
            "Autoclave or incinerate infected materials",
            "Disinfect all equipment after use",
            "Dispose of PPE in biohazard containers",
            "Clean area with approved disinfectant"
        ],
        public_health_advice=f"{disease} is a zoonotic disease that can transmit to humans. Immediate reporting to authorities is mandatory.",
        reporting_requirements="Report to District Veterinary Officer within 24 hours. Notify State Animal Husbandry Department. Complete Form A for disease notification.",
        legal_disclaimer="This safety information is for reference only. Always follow local regulations and consult with public health authorities."
    )

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    # Check if phone already exists
    existing = await db.users.find_one({"phone": user.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    
    await db.users.insert_one(user_dict)
    
    del user_dict["password"]
    if "_id" in user_dict:
        del user_dict["_id"]
    return UserResponse(**user_dict)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_user(credentials: UserLogin):
    user = await db.users.find_one({"phone": credentials.phone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["role"] != credentials.role:
        raise HTTPException(status_code=401, detail="Invalid role for this user")
    
    token = create_token(user["id"], user["role"])
    
    user_response = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(access_token=token, user=UserResponse(**user_response))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in user.items() if k != "password"})

# Guest access - no authentication needed
@api_router.post("/auth/guest-session")
async def create_guest_session():
    """Create a temporary guest session"""
    guest_id = str(uuid.uuid4())
    token = create_token(guest_id, "guest")
    return {"access_token": token, "token_type": "bearer", "guest_id": guest_id}

# ============ ANIMAL ROUTES ============

@api_router.post("/animals", response_model=AnimalResponse)
async def create_animal(animal: AnimalCreate, user: dict = Depends(require_role([UserRole.FARMER, UserRole.PARAVET, UserRole.VETERINARIAN, UserRole.ADMIN]))):
    animal_dict = animal.model_dump()
    animal_dict["id"] = str(uuid.uuid4())
    animal_dict["farmer_id"] = user["id"]
    animal_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    animal_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.animals.insert_one(animal_dict)
    if "_id" in animal_dict:
        del animal_dict["_id"]
    return AnimalResponse(**animal_dict)

@api_router.get("/animals", response_model=List[AnimalResponse])
async def get_animals(
    species: Optional[Species] = None,
    user: dict = Depends(get_current_user)
):
    query = {"farmer_id": user["id"]}
    if user["role"] in ["veterinarian", "admin", "paravet"]:
        query = {}  # Can see all animals
    
    if species:
        query["species"] = species.value
    
    animals = await db.animals.find(query, {"_id": 0}).to_list(1000)
    return [AnimalResponse(**a) for a in animals]

@api_router.get("/animals/{animal_id}", response_model=AnimalResponse)
async def get_animal(animal_id: str, user: dict = Depends(get_current_user)):
    animal = await db.animals.find_one({"id": animal_id}, {"_id": 0})
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return AnimalResponse(**animal)

@api_router.put("/animals/{animal_id}", response_model=AnimalResponse)
async def update_animal(animal_id: str, animal: AnimalCreate, user: dict = Depends(get_current_user)):
    existing = await db.animals.find_one({"id": animal_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    update_dict = animal.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.animals.update_one({"id": animal_id}, {"$set": update_dict})
    updated = await db.animals.find_one({"id": animal_id}, {"_id": 0})
    return AnimalResponse(**updated)

@api_router.delete("/animals/{animal_id}")
async def delete_animal(animal_id: str, user: dict = Depends(get_current_user)):
    result = await db.animals.delete_one({"id": animal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Animal not found")
    return {"message": "Animal deleted successfully"}

# ============ VACCINATION ROUTES ============

@api_router.post("/vaccinations", response_model=VaccinationResponse)
async def create_vaccination(vaccination: VaccinationCreate, user: dict = Depends(require_role([UserRole.FARMER, UserRole.PARAVET, UserRole.VETERINARIAN, UserRole.ADMIN]))):
    vacc_dict = vaccination.model_dump()
    vacc_dict["id"] = str(uuid.uuid4())
    vacc_dict["farmer_id"] = user["id"]
    vacc_dict["date"] = datetime.now(timezone.utc).isoformat()
    vacc_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.vaccinations.insert_one(vacc_dict)
    if "_id" in vacc_dict:
        del vacc_dict["_id"]
    return VaccinationResponse(**vacc_dict)

@api_router.get("/vaccinations", response_model=List[VaccinationResponse])
async def get_vaccinations(animal_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "farmer":
        query["farmer_id"] = user["id"]
    if animal_id:
        query["animal_id"] = animal_id
    
    vaccinations = await db.vaccinations.find(query, {"_id": 0}).to_list(1000)
    return [VaccinationResponse(**v) for v in vaccinations]

# ============ DEWORMING ROUTES ============

@api_router.post("/deworming", response_model=DewormingResponse)
async def create_deworming(deworming: DewormingCreate, user: dict = Depends(require_role([UserRole.FARMER, UserRole.PARAVET, UserRole.VETERINARIAN, UserRole.ADMIN]))):
    dew_dict = deworming.model_dump()
    dew_dict["id"] = str(uuid.uuid4())
    dew_dict["farmer_id"] = user["id"]
    dew_dict["date"] = datetime.now(timezone.utc).isoformat()
    dew_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.deworming.insert_one(dew_dict)
    if "_id" in dew_dict:
        del dew_dict["_id"]
    return DewormingResponse(**dew_dict)

@api_router.get("/deworming", response_model=List[DewormingResponse])
async def get_deworming(animal_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "farmer":
        query["farmer_id"] = user["id"]
    if animal_id:
        query["animal_id"] = animal_id
    
    records = await db.deworming.find(query, {"_id": 0}).to_list(1000)
    return [DewormingResponse(**r) for r in records]

# ============ BREEDING ROUTES ============

@api_router.post("/breeding", response_model=BreedingResponse)
async def create_breeding(breeding: BreedingCreate, user: dict = Depends(require_role([UserRole.FARMER, UserRole.PARAVET, UserRole.VETERINARIAN, UserRole.ADMIN]))):
    breed_dict = breeding.model_dump()
    breed_dict["id"] = str(uuid.uuid4())
    breed_dict["farmer_id"] = user["id"]
    breed_dict["date"] = datetime.now(timezone.utc).isoformat()
    breed_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.breeding.insert_one(breed_dict)
    if "_id" in breed_dict:
        del breed_dict["_id"]
    return BreedingResponse(**breed_dict)

@api_router.get("/breeding", response_model=List[BreedingResponse])
async def get_breeding(animal_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "farmer":
        query["farmer_id"] = user["id"]
    if animal_id:
        query["animal_id"] = animal_id
    
    records = await db.breeding.find(query, {"_id": 0}).to_list(1000)
    return [BreedingResponse(**r) for r in records]

# ============ DIAGNOSTICS ROUTES (VET ONLY) ============

@api_router.post("/diagnostics", response_model=DiagnosticTestResponse)
async def create_diagnostic(diagnostic: DiagnosticTestCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    diag_dict = diagnostic.model_dump()
    diag_dict["id"] = str(uuid.uuid4())
    diag_dict["vet_id"] = user["id"]
    diag_dict["date"] = datetime.now(timezone.utc).isoformat()
    diag_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Auto-interpret based on knowledge center
    interpretation = await interpret_diagnostic(
        diag_dict["test_category"],
        diag_dict["test_type"],
        diag_dict["species"],
        diag_dict.get("value"),
        diag_dict.get("value_text")
    )
    diag_dict["interpretation"] = interpretation
    
    await db.diagnostics.insert_one(diag_dict)
    if "_id" in diag_dict:
        del diag_dict["_id"]
    return DiagnosticTestResponse(**diag_dict)

@api_router.get("/diagnostics", response_model=List[DiagnosticTestResponse])
async def get_diagnostics(
    animal_id: Optional[str] = None,
    test_category: Optional[TestCategory] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {}
    if animal_id:
        query["animal_id"] = animal_id
    if test_category:
        query["test_category"] = test_category.value
    
    records = await db.diagnostics.find(query, {"_id": 0}).to_list(1000)
    return [DiagnosticTestResponse(**r) for r in records]

async def interpret_diagnostic(test_category: str, test_type: str, species: str, value: Optional[float], value_text: Optional[str]) -> Dict:
    """Auto-interpret diagnostic values based on knowledge center"""
    
    # Look up reference data
    ref = await db.knowledge_center.find_one({
        "test_category": test_category,
        "test_type": test_type,
        "species": species
    }, {"_id": 0})
    
    interpretation = {
        "status": "normal",
        "normal_range": None,
        "possible_conditions": [],
        "special_symptoms": [],
        "suggested_actions": [],
        "safety_alert": None
    }
    
    if not ref:
        interpretation["status"] = "normal"
        interpretation["suggested_actions"] = ["No reference data available. Please consult knowledge center."]
        return interpretation
    
    ref_data = ref.get("reference_data", {})
    
    # Set normal range
    if ref_data.get("normal_min") is not None and ref_data.get("normal_max") is not None:
        interpretation["normal_range"] = f"{ref_data['normal_min']} - {ref_data['normal_max']} {ref_data.get('unit', '')}"
    
    # Numeric interpretation
    if value is not None and ref_data.get("normal_min") is not None:
        if value > ref_data.get("normal_max", float('inf')):
            interpretation["status"] = "high"
            interpretation["possible_conditions"] = ref_data.get("increase_causes", [])
        elif value < ref_data.get("normal_min", 0):
            interpretation["status"] = "low"
            interpretation["possible_conditions"] = ref_data.get("decrease_causes", [])
        else:
            interpretation["status"] = "normal"
    
    # Text interpretation (positive/negative)
    if value_text:
        if value_text.lower() == "positive":
            interpretation["status"] = "positive"
            interpretation["possible_conditions"] = ref_data.get("increase_causes", [])
        elif value_text.lower() == "negative":
            interpretation["status"] = "negative"
    
    interpretation["special_symptoms"] = ref_data.get("special_symptoms", [])
    interpretation["suggested_actions"] = ref_data.get("suggested_actions", [])
    
    # Check for zoonotic diseases
    for condition in interpretation["possible_conditions"]:
        for disease in HIGH_RISK_DISEASES:
            if disease.lower() in condition.lower():
                interpretation["safety_alert"] = get_safety_alert(disease).model_dump() if get_safety_alert(disease) else None
                break
    
    return interpretation

# ============ KNOWLEDGE CENTER ROUTES ============

@api_router.get("/knowledge-center", response_model=List[KnowledgeCenterResponse])
async def get_knowledge_center(
    test_category: Optional[TestCategory] = None,
    species: Optional[Species] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {}
    if test_category:
        query["test_category"] = test_category.value
    if species:
        query["species"] = species.value
    
    entries = await db.knowledge_center.find(query, {"_id": 0}).to_list(1000)
    return [KnowledgeCenterResponse(**e) for e in entries]

@api_router.post("/knowledge-center", response_model=KnowledgeCenterResponse)
async def create_knowledge_entry(entry: KnowledgeCenterEntry, user: dict = Depends(require_role([UserRole.ADMIN]))):
    entry_dict = entry.model_dump()
    entry_dict["id"] = str(uuid.uuid4())
    entry_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    entry_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.knowledge_center.insert_one(entry_dict)
    if "_id" in entry_dict:
        del entry_dict["_id"]
    return KnowledgeCenterResponse(**entry_dict)

@api_router.put("/knowledge-center/{entry_id}", response_model=KnowledgeCenterResponse)
async def update_knowledge_entry(entry_id: str, entry: KnowledgeCenterEntry, user: dict = Depends(require_role([UserRole.ADMIN]))):
    existing = await db.knowledge_center.find_one({"id": entry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_dict = entry.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.knowledge_center.update_one({"id": entry_id}, {"$set": update_dict})
    updated = await db.knowledge_center.find_one({"id": entry_id}, {"_id": 0})
    return KnowledgeCenterResponse(**updated)

@api_router.delete("/knowledge-center/{entry_id}")
async def delete_knowledge_entry(entry_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    result = await db.knowledge_center.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted successfully"}

# ============ GUEST UTILITIES ============

class AreaCalculation(BaseModel):
    length: float
    width: float
    unit: str = "meters"

class InterestCalculation(BaseModel):
    principal: float
    rate: float
    time_years: float

@api_router.post("/utilities/area-calculator")
async def calculate_area(data: AreaCalculation):
    area = data.length * data.width
    # Convert to different units
    result = {
        "input": data.model_dump(),
        "area_sq_meters": area if data.unit == "meters" else area * 0.0929 if data.unit == "feet" else area,
        "area_sq_feet": area * 10.764 if data.unit == "meters" else area if data.unit == "feet" else area * 10.764,
        "area_acres": (area if data.unit == "meters" else area * 0.0929) / 4046.86,
        "area_hectares": (area if data.unit == "meters" else area * 0.0929) / 10000
    }
    return result

@api_router.post("/utilities/interest-calculator")
async def calculate_interest(data: InterestCalculation):
    simple_interest = (data.principal * data.rate * data.time_years) / 100
    compound_interest = data.principal * ((1 + data.rate/100) ** data.time_years - 1)
    
    return {
        "input": data.model_dump(),
        "simple_interest": round(simple_interest, 2),
        "simple_total": round(data.principal + simple_interest, 2),
        "compound_interest": round(compound_interest, 2),
        "compound_total": round(data.principal + compound_interest, 2)
    }

# ============ PDF GENERATION ============

@api_router.get("/reports/diagnostic/{diagnostic_id}/pdf")
async def generate_diagnostic_pdf(diagnostic_id: str, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    """Generate PDF report for a diagnostic test"""
    diagnostic = await db.diagnostics.find_one({"id": diagnostic_id}, {"_id": 0})
    if not diagnostic:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    
    animal = await db.animals.find_one({"id": diagnostic["animal_id"]}, {"_id": 0})
    
    # Generate simple PDF content
    pdf_content = generate_diagnostic_pdf_content(diagnostic, animal)
    
    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=diagnostic_report_{diagnostic_id}.pdf"}
    )

def generate_diagnostic_pdf_content(diagnostic: dict, animal: dict) -> bytes:
    """Generate PDF content for diagnostic report"""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#15803d'), alignment=1)
        elements.append(Paragraph("SMART LIVESTOCK CARE", title_style))
        elements.append(Paragraph("Diagnostic Test Report", styles['Heading2']))
        elements.append(Spacer(1, 20))
        
        # Animal Info
        if animal:
            animal_data = [
                ["Tag ID:", animal.get("tag_id", "N/A"), "Species:", animal.get("species", "N/A")],
                ["Breed:", animal.get("breed", "N/A"), "Age:", f"{animal.get('age_months', 'N/A')} months"],
            ]
            t = Table(animal_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#15803d')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 20))
        
        # Test Details
        elements.append(Paragraph("Test Details", styles['Heading3']))
        test_data = [
            ["Test Category:", diagnostic.get("test_category", "N/A")],
            ["Test Type:", diagnostic.get("test_type", "N/A")],
            ["Value:", f"{diagnostic.get('value', diagnostic.get('value_text', 'N/A'))} {diagnostic.get('unit', '')}"],
            ["Date:", diagnostic.get("date", "N/A")[:10]],
        ]
        t = Table(test_data, colWidths=[2*inch, 4*inch])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))
        
        # Interpretation
        interp = diagnostic.get("interpretation", {})
        if interp:
            elements.append(Paragraph("Interpretation", styles['Heading3']))
            
            status = interp.get("status", "normal").upper()
            status_color = colors.green if status == "NORMAL" else colors.red if status in ["HIGH", "POSITIVE"] else colors.blue
            elements.append(Paragraph(f"<b>Status:</b> <font color='{status_color}'>{status}</font>", styles['Normal']))
            
            if interp.get("normal_range"):
                elements.append(Paragraph(f"<b>Normal Range:</b> {interp['normal_range']}", styles['Normal']))
            
            if interp.get("possible_conditions"):
                elements.append(Paragraph("<b>Possible Conditions:</b>", styles['Normal']))
                for cond in interp["possible_conditions"][:5]:
                    elements.append(Paragraph(f"• {cond}", styles['Normal']))
            
            if interp.get("suggested_actions"):
                elements.append(Spacer(1, 10))
                elements.append(Paragraph("<b>Suggested Actions:</b>", styles['Normal']))
                for action in interp["suggested_actions"][:5]:
                    elements.append(Paragraph(f"• {action}", styles['Normal']))
        
        # Safety Alert
        safety = interp.get("safety_alert") if interp else None
        if safety:
            elements.append(Spacer(1, 20))
            alert_style = ParagraphStyle('Alert', parent=styles['Normal'], backColor=colors.HexColor('#fef2f2'), borderColor=colors.red, borderWidth=1, borderPadding=10)
            elements.append(Paragraph(f"⚠️ SAFETY ALERT: {safety.get('disease', 'HIGH-RISK DISEASE')}", ParagraphStyle('AlertTitle', parent=styles['Heading3'], textColor=colors.red)))
            elements.append(Paragraph(f"<b>PPE Requirements:</b> {', '.join(safety.get('ppe_requirements', [])[:3])}", styles['Normal']))
            elements.append(Paragraph(f"<b>Public Health:</b> {safety.get('public_health_advice', '')}", styles['Normal']))
        
        # Disclaimer
        elements.append(Spacer(1, 30))
        disclaimer_style = ParagraphStyle('Disclaimer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)
        elements.append(Paragraph("DISCLAIMER: This system provides clinical reference and decision support only. Final diagnosis and treatment decisions must be made by a registered veterinarian.", disclaimer_style))
        
        doc.build(elements)
        return buffer.getvalue()
        
    except ImportError:
        # Fallback to simple text PDF if reportlab not available
        return b"PDF generation requires reportlab library"

# ============ ADMIN ROUTES ============

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user: dict = Depends(require_role([UserRole.ADMIN]))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, is_active: bool, user: dict = Depends(require_role([UserRole.ADMIN]))):
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_active": is_active}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_role([UserRole.ADMIN]))):
    users_count = await db.users.count_documents({})
    animals_count = await db.animals.count_documents({})
    diagnostics_count = await db.diagnostics.count_documents({})
    vaccinations_count = await db.vaccinations.count_documents({})
    
    return {
        "total_users": users_count,
        "total_animals": animals_count,
        "total_diagnostics": diagnostics_count,
        "total_vaccinations": vaccinations_count
    }

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/farmer-stats")
async def get_farmer_stats(user: dict = Depends(require_role([UserRole.FARMER]))):
    animals_count = await db.animals.count_documents({"farmer_id": user["id"]})
    vaccinations_count = await db.vaccinations.count_documents({"farmer_id": user["id"]})
    deworming_count = await db.deworming.count_documents({"farmer_id": user["id"]})
    breeding_count = await db.breeding.count_documents({"farmer_id": user["id"]})
    
    return {
        "total_animals": animals_count,
        "total_vaccinations": vaccinations_count,
        "total_deworming": deworming_count,
        "total_breeding": breeding_count
    }

@api_router.get("/dashboard/vet-stats")
async def get_vet_stats(user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    diagnostics_today = await db.diagnostics.count_documents({
        "date": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()}
    })
    total_diagnostics = await db.diagnostics.count_documents({})
    total_animals = await db.animals.count_documents({})
    knowledge_entries = await db.knowledge_center.count_documents({})
    
    return {
        "diagnostics_today": diagnostics_today,
        "total_diagnostics": total_diagnostics,
        "total_animals": total_animals,
        "knowledge_entries": knowledge_entries
    }

# ============ MAIN APP SETUP ============

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
