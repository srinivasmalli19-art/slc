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

# ============ ADMIN ROUTES (Legacy - see enhanced routes below) ============
# Note: Enhanced admin routes with filters are defined in the ADMIN DASHBOARD section

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

# ============ VET PROFILE & INSTITUTION MODELS ============

class VetProfileBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    registration_number: str
    qualification: str
    mobile_number: str
    institution_name: Optional[str] = None
    working_village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    date_of_joining: Optional[str] = None
    remarks: Optional[str] = None

class VetProfileCreate(VetProfileBase):
    pass

class VetProfileResponse(VetProfileBase):
    id: str
    vet_id: str
    user_id: str
    user_name: str
    is_complete: bool
    created_at: str
    updated_at: str

class InstitutionBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    institution_name: str
    location: str
    mandal: str
    district: str
    state: str
    contact_number: Optional[str] = None
    jurisdiction_villages: List[str] = []

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: str
    is_verified: bool
    created_by: str
    created_at: str
    updated_at: str

# ============ OPD/IPD REGISTER MODELS ============

class OPDCaseBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tag_number: str
    farmer_name: str
    farmer_village: str
    farmer_phone: Optional[str] = None
    species: Species
    breed: Optional[str] = None
    age_months: Optional[int] = None
    symptoms: str
    tentative_diagnosis: str
    treatment: str
    result: CaseResult = CaseResult.ONGOING
    follow_up_date: Optional[str] = None
    remarks: Optional[str] = None

class OPDCaseCreate(OPDCaseBase):
    pass

class OPDCaseResponse(OPDCaseBase):
    id: str
    case_number: str
    serial_number: int
    case_type: str
    vet_id: str
    vet_name: str
    case_date: str
    created_at: str
    updated_at: str

class IPDCaseBase(OPDCaseBase):
    admission_date: str
    discharge_date: Optional[str] = None
    bed_number: Optional[str] = None
    daily_observations: List[str] = []

class IPDCaseCreate(IPDCaseBase):
    pass

class IPDCaseResponse(IPDCaseBase):
    id: str
    case_number: str
    serial_number: int
    case_type: str
    vet_id: str
    vet_name: str
    case_date: str
    created_at: str
    updated_at: str

# ============ CLINICAL REGISTERS MODELS ============

class SurgeryType(str, Enum):
    CAESAREAN = "caesarean"
    RUMENOTOMY = "rumenotomy"
    HERNIA = "hernia"
    CASTRATION_SURGICAL = "castration_surgical"
    TUMOR_REMOVAL = "tumor_removal"
    DEHORNING = "dehorning"
    TAIL_DOCKING = "tail_docking"
    WOUND_SUTURING = "wound_suturing"
    ABSCESS_DRAINAGE = "abscess_drainage"
    FRACTURE_REPAIR = "fracture_repair"
    TEAT_SURGERY = "teat_surgery"
    EYE_SURGERY = "eye_surgery"
    OTHER = "other"

class AnesthesiaType(str, Enum):
    LOCAL = "local"
    REGIONAL = "regional"
    EPIDURAL = "epidural"
    GENERAL = "general"
    SEDATION = "sedation"
    NONE = "none"

class SurgeryOutcome(str, Enum):
    SUCCESSFUL = "successful"
    PARTIAL_SUCCESS = "partial_success"
    COMPLICATIONS = "complications"
    FAILED = "failed"
    DIED_DURING = "died_during"
    DIED_POST_OP = "died_post_op"

class SurgicalCaseBase(BaseModel):
    tag_number: str
    farmer_name: str
    farmer_village: Optional[str] = None
    farmer_phone: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    surgery_type: str
    surgery_type_other: Optional[str] = None
    pre_op_condition: str
    anesthesia_type: str
    anesthesia_details: Optional[str] = None
    surgical_procedure: str
    findings: Optional[str] = None
    post_op_care: Optional[str] = None
    outcome: str = "successful"
    complications: Optional[str] = None
    follow_up_date: Optional[str] = None
    remarks: Optional[str] = None

class SurgicalCaseCreate(SurgicalCaseBase):
    pass

class SurgicalCaseResponse(SurgicalCaseBase):
    id: str
    case_number: str
    serial_number: int
    vet_id: str
    vet_name: str
    surgery_date: str
    created_at: str
    updated_at: str

class GynaecologyCondition(str, Enum):
    REPEAT_BREEDER = "repeat_breeder"
    ANOESTRUS = "anoestrus"
    METRITIS = "metritis"
    PYOMETRA = "pyometra"
    RETAINED_PLACENTA = "retained_placenta"
    DYSTOCIA = "dystocia"
    PROLAPSE_UTERUS = "prolapse_uterus"
    PROLAPSE_VAGINA = "prolapse_vagina"
    OVARIAN_CYST = "ovarian_cyst"
    MASTITIS = "mastitis"
    PREGNANCY_DIAGNOSIS = "pregnancy_diagnosis"
    ABORTION = "abortion"
    OTHER = "other"

class GynaecologyCaseBase(BaseModel):
    tag_number: str
    farmer_name: str
    farmer_village: Optional[str] = None
    farmer_phone: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    parity: Optional[int] = None
    last_calving_date: Optional[str] = None
    breeding_history: Optional[str] = None
    condition: str
    condition_other: Optional[str] = None
    symptoms: str
    per_rectal_findings: Optional[str] = None
    diagnosis: str
    treatment: str
    prognosis: Optional[str] = None
    follow_up_date: Optional[str] = None
    result: str = "ongoing"
    remarks: Optional[str] = None

class GynaecologyCaseCreate(GynaecologyCaseBase):
    pass

class GynaecologyCaseResponse(GynaecologyCaseBase):
    id: str
    case_number: str
    serial_number: int
    vet_id: str
    vet_name: str
    case_date: str
    created_at: str
    updated_at: str

class CastrationMethod(str, Enum):
    SURGICAL_OPEN = "surgical_open"
    SURGICAL_CLOSED = "surgical_closed"
    BURDIZZO = "burdizzo"
    RUBBER_RING = "rubber_ring"
    CHEMICAL = "chemical"

class CastrationCaseBase(BaseModel):
    tag_number: str
    farmer_name: str
    farmer_village: Optional[str] = None
    farmer_phone: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    body_weight_kg: Optional[float] = None
    method: str
    anesthesia_used: str = "local"
    anesthesia_details: Optional[str] = None
    procedure_details: Optional[str] = None
    outcome: str = "successful"
    complications: Optional[str] = None
    post_op_care: Optional[str] = None
    follow_up_date: Optional[str] = None
    remarks: Optional[str] = None

class CastrationCaseCreate(CastrationCaseBase):
    pass

class CastrationCaseResponse(CastrationCaseBase):
    id: str
    case_number: str
    serial_number: int
    vet_id: str
    vet_name: str
    castration_date: str
    created_at: str
    updated_at: str

# ============ VET PROFILE & INSTITUTION ROUTES ============

async def generate_vet_id():
    """Generate unique Vet ID: VET-YYYY-XXXXX"""
    year = datetime.now(timezone.utc).year
    count = await db.vet_profiles.count_documents({"vet_id": {"$regex": f"^VET-{year}-"}})
    return f"VET-{year}-{str(count + 1).zfill(5)}"

@api_router.post("/vet/profile", response_model=VetProfileResponse)
async def create_vet_profile(profile: VetProfileCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    # Check if profile already exists
    existing = await db.vet_profiles.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    # Check if registration number is unique
    reg_exists = await db.vet_profiles.find_one({"registration_number": profile.registration_number})
    if reg_exists:
        raise HTTPException(status_code=400, detail="Registration number already registered")
    
    profile_dict = profile.model_dump()
    profile_dict["id"] = str(uuid.uuid4())
    profile_dict["vet_id"] = await generate_vet_id()
    profile_dict["user_id"] = user["id"]
    profile_dict["user_name"] = user["name"]
    profile_dict["is_complete"] = all([
        profile.registration_number,
        profile.qualification,
        profile.mobile_number
    ])
    profile_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    profile_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.vet_profiles.insert_one(profile_dict)
    if "_id" in profile_dict:
        del profile_dict["_id"]
    return VetProfileResponse(**profile_dict)

@api_router.get("/vet/profile", response_model=Optional[VetProfileResponse])
async def get_vet_profile(user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    profile = await db.vet_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        return None
    return VetProfileResponse(**profile)

@api_router.put("/vet/profile", response_model=VetProfileResponse)
async def update_vet_profile(profile: VetProfileCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    existing = await db.vet_profiles.find_one({"user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Registration number cannot be changed once set
    if existing.get("registration_number") and existing["registration_number"] != profile.registration_number:
        raise HTTPException(status_code=400, detail="Registration number cannot be modified")
    
    update_dict = profile.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["is_complete"] = all([
        profile.registration_number,
        profile.qualification,
        profile.mobile_number
    ])
    
    await db.vet_profiles.update_one({"user_id": user["id"]}, {"$set": update_dict})
    updated = await db.vet_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return VetProfileResponse(**updated)

@api_router.post("/vet/institution", response_model=InstitutionResponse)
async def create_institution(institution: InstitutionCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    inst_dict = institution.model_dump()
    inst_dict["id"] = str(uuid.uuid4())
    inst_dict["is_verified"] = False
    inst_dict["created_by"] = user["id"]
    inst_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    inst_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.institutions.insert_one(inst_dict)
    if "_id" in inst_dict:
        del inst_dict["_id"]
    return InstitutionResponse(**inst_dict)

@api_router.get("/vet/institutions", response_model=List[InstitutionResponse])
async def get_institutions(user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    institutions = await db.institutions.find({}, {"_id": 0}).to_list(100)
    return [InstitutionResponse(**i) for i in institutions]

@api_router.get("/vet/institution/{institution_id}", response_model=InstitutionResponse)
async def get_institution(institution_id: str, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    institution = await db.institutions.find_one({"id": institution_id}, {"_id": 0})
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    return InstitutionResponse(**institution)

# ============ OPD REGISTER ROUTES ============

async def generate_opd_case_number(case_type: str = "OPD"):
    """Generate case number: OPD-YYYY-XXXXX"""
    year = datetime.now(timezone.utc).year
    prefix = case_type.upper()
    count = await db.opd_cases.count_documents({
        "case_number": {"$regex": f"^{prefix}-{year}-"}
    })
    return f"{prefix}-{year}-{str(count + 1).zfill(5)}"

async def get_serial_number_for_year(case_type: str = "OPD"):
    """Get next serial number for the year"""
    year = datetime.now(timezone.utc).year
    start_of_year = datetime(year, 1, 1, tzinfo=timezone.utc).isoformat()
    count = await db.opd_cases.count_documents({
        "case_type": case_type.lower(),
        "created_at": {"$gte": start_of_year}
    })
    return count + 1

@api_router.post("/vet/opd", response_model=OPDCaseResponse)
async def create_opd_case(case: OPDCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    # Check if vet profile is complete
    vet_profile = await db.vet_profiles.find_one({"user_id": user["id"]})
    
    case_dict = case.model_dump()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["case_number"] = await generate_opd_case_number("OPD")
    case_dict["serial_number"] = await get_serial_number_for_year("OPD")
    case_dict["case_type"] = "opd"
    case_dict["vet_id"] = user["id"]
    case_dict["vet_name"] = user["name"]
    case_dict["case_date"] = datetime.now(timezone.utc).isoformat()
    case_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    case_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.opd_cases.insert_one(case_dict)
    if "_id" in case_dict:
        del case_dict["_id"]
    return OPDCaseResponse(**case_dict)

@api_router.get("/vet/opd", response_model=List[OPDCaseResponse])
async def get_opd_cases(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    species: Optional[Species] = None,
    result: Optional[CaseResult] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {"case_type": "opd"}
    
    if date_from:
        query["case_date"] = {"$gte": date_from}
    if date_to:
        if "case_date" in query:
            query["case_date"]["$lte"] = date_to
        else:
            query["case_date"] = {"$lte": date_to}
    if species:
        query["species"] = species.value
    if result:
        query["result"] = result.value
    
    cases = await db.opd_cases.find(query, {"_id": 0}).sort("serial_number", -1).to_list(1000)
    return [OPDCaseResponse(**c) for c in cases]

@api_router.get("/vet/opd/{case_id}", response_model=OPDCaseResponse)
async def get_opd_case(case_id: str, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    case = await db.opd_cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return OPDCaseResponse(**case)

@api_router.put("/vet/opd/{case_id}", response_model=OPDCaseResponse)
async def update_opd_case(case_id: str, case: OPDCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    existing = await db.opd_cases.find_one({"id": case_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_dict = case.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.opd_cases.update_one({"id": case_id}, {"$set": update_dict})
    updated = await db.opd_cases.find_one({"id": case_id}, {"_id": 0})
    return OPDCaseResponse(**updated)

# ============ IPD REGISTER ROUTES ============

@api_router.post("/vet/ipd", response_model=IPDCaseResponse)
async def create_ipd_case(case: IPDCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    case_dict = case.model_dump()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["case_number"] = await generate_opd_case_number("IPD")
    case_dict["serial_number"] = await get_serial_number_for_year("IPD")
    case_dict["case_type"] = "ipd"
    case_dict["vet_id"] = user["id"]
    case_dict["vet_name"] = user["name"]
    case_dict["case_date"] = datetime.now(timezone.utc).isoformat()
    case_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    case_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.opd_cases.insert_one(case_dict)
    if "_id" in case_dict:
        del case_dict["_id"]
    return IPDCaseResponse(**case_dict)

@api_router.get("/vet/ipd", response_model=List[IPDCaseResponse])
async def get_ipd_cases(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {"case_type": "ipd"}
    
    if date_from:
        query["case_date"] = {"$gte": date_from}
    if date_to:
        if "case_date" in query:
            query["case_date"]["$lte"] = date_to
        else:
            query["case_date"] = {"$lte": date_to}
    
    cases = await db.opd_cases.find(query, {"_id": 0}).sort("serial_number", -1).to_list(1000)
    return [IPDCaseResponse(**c) for c in cases]

# ============ VET DASHBOARD STATS (ENHANCED) ============

@api_router.get("/dashboard/vet-stats-detailed")
async def get_vet_stats_detailed(user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # OPD cases today
    opd_today = await db.opd_cases.count_documents({
        "case_type": "opd",
        "case_date": {"$gte": today_start}
    })
    
    # IPD admissions (active)
    ipd_active = await db.opd_cases.count_documents({
        "case_type": "ipd",
        "discharge_date": None
    })
    
    # Vaccinations today (approximate from all vaccinations)
    vaccinations_today = await db.vaccinations.count_documents({
        "date": {"$gte": today_start}
    })
    
    # AI cases today
    ai_today = await db.breeding.count_documents({
        "breeding_type": "AI",
        "date": {"$gte": today_start}
    })
    
    # Mortality cases (result = died)
    mortality_today = await db.opd_cases.count_documents({
        "result": "died",
        "updated_at": {"$gte": today_start}
    })
    
    # Total counts
    total_opd = await db.opd_cases.count_documents({"case_type": "opd"})
    total_ipd = await db.opd_cases.count_documents({"case_type": "ipd"})
    total_animals = await db.animals.count_documents({})
    knowledge_entries = await db.knowledge_center.count_documents({})
    
    # Pending follow-ups
    pending_followups = await db.opd_cases.count_documents({
        "result": "followup",
        "follow_up_date": {"$lte": datetime.now(timezone.utc).isoformat()}
    })
    
    # Check vet profile completion
    vet_profile = await db.vet_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    profile_complete = vet_profile.get("is_complete", False) if vet_profile else False
    
    return {
        "opd_today": opd_today,
        "ipd_active": ipd_active,
        "vaccinations_today": vaccinations_today,
        "ai_today": ai_today,
        "mortality_today": mortality_today,
        "total_opd": total_opd,
        "total_ipd": total_ipd,
        "total_animals": total_animals,
        "knowledge_entries": knowledge_entries,
        "pending_followups": pending_followups,
        "profile_complete": profile_complete,
        "vet_id": vet_profile.get("vet_id") if vet_profile else None
    }

# ============ ALERTS API ============

@api_router.get("/vet/alerts")
async def get_vet_alerts(user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    alerts = []
    today = datetime.now(timezone.utc).isoformat()
    
    # Check for pending follow-ups
    pending_followups = await db.opd_cases.find({
        "result": "followup",
        "follow_up_date": {"$lte": today}
    }, {"_id": 0}).to_list(10)
    
    for fu in pending_followups:
        alerts.append({
            "type": "followup",
            "severity": "warning",
            "title": "Follow-up Due",
            "message": f"Case {fu.get('case_number')} - {fu.get('farmer_name')} requires follow-up",
            "case_id": fu.get("id"),
            "date": fu.get("follow_up_date")
        })
    
    # Check vet profile completion
    vet_profile = await db.vet_profiles.find_one({"user_id": user["id"]})
    if not vet_profile or not vet_profile.get("is_complete"):
        alerts.append({
            "type": "profile",
            "severity": "info",
            "title": "Complete Your Profile",
            "message": "Please complete your veterinarian profile to enable certificates",
            "case_id": None,
            "date": today
        })
    
    # Check for high-risk cases (zoonotic diseases in diagnosis)
    high_risk_cases = await db.opd_cases.find({
        "tentative_diagnosis": {"$regex": "|".join(HIGH_RISK_DISEASES), "$options": "i"},
        "result": {"$ne": "recovered"}
    }, {"_id": 0}).to_list(10)
    
    for case in high_risk_cases:
        alerts.append({
            "type": "zoonotic",
            "severity": "critical",
            "title": "Zoonotic Disease Alert",
            "message": f"Case {case.get('case_number')} - Suspected {case.get('tentative_diagnosis')}. Follow safety protocols.",
            "case_id": case.get("id"),
            "date": case.get("case_date")
        })
    
    return {"alerts": alerts, "total": len(alerts)}

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

# ============ ADMIN MODELS ============

class AdminActionType(str, Enum):
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_ACTIVATE = "user_activate"
    USER_DEACTIVATE = "user_deactivate"
    USER_LOCK = "user_lock"
    USER_UNLOCK = "user_unlock"
    KNOWLEDGE_CREATE = "knowledge_create"
    KNOWLEDGE_UPDATE = "knowledge_update"
    KNOWLEDGE_ARCHIVE = "knowledge_archive"
    KNOWLEDGE_PUBLISH = "knowledge_publish"
    SAFETY_RULE_CREATE = "safety_rule_create"
    SAFETY_RULE_UPDATE = "safety_rule_update"
    RECORD_LOCK = "record_lock"
    RECORD_UNLOCK = "record_unlock"
    SETTING_UPDATE = "setting_update"
    NOTIFICATION_SEND = "notification_send"

class AuditLogBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action_type: AdminActionType
    target_type: str  # user, knowledge, safety_rule, record, setting
    target_id: str
    before_value: Optional[Dict[str, Any]] = None
    after_value: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None

class AuditLogResponse(AuditLogBase):
    id: str
    admin_id: str
    admin_name: str
    timestamp: str
    ip_address: Optional[str] = None

class SafetyRuleBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    disease_name: str
    species_affected: List[str] = []
    ppe_instructions: str
    isolation_protocols: str
    milk_meat_restriction: str
    disposal_procedures: str
    government_reporting: str
    is_active: bool = True

class SafetyRuleCreate(SafetyRuleBase):
    pass

class SafetyRuleResponse(SafetyRuleBase):
    id: str
    created_by: str
    created_at: str
    updated_at: str
    version: int

class KnowledgeEntryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category: str  # cbc, biochemistry, parasitology, etc.
    species: Species
    parameter_name: str
    normal_range_min: Optional[float] = None
    normal_range_max: Optional[float] = None
    unit: str
    interpretation_rules: str
    pathognomonic_symptoms: Optional[str] = None
    suggested_management: Optional[str] = None

class KnowledgeEntryCreate(KnowledgeEntryBase):
    pass

class KnowledgeEntryResponse(KnowledgeEntryBase):
    id: str
    version: int
    status: str  # draft, published, archived
    created_by: str
    created_at: str
    updated_at: str

class SystemNotificationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    message: str
    target_roles: List[str] = []  # empty = all
    target_regions: List[str] = []  # empty = all
    priority: str = "normal"  # low, normal, high, urgent
    expires_at: Optional[str] = None

class SystemNotificationCreate(SystemNotificationBase):
    pass

class SystemNotificationResponse(SystemNotificationBase):
    id: str
    created_by: str
    created_at: str
    read_count: int

class SystemSettingBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    value: str
    description: Optional[str] = None
    category: str  # general, alerts, notifications, display

# ============ ADMIN HELPER FUNCTIONS ============

async def log_admin_action(
    admin_id: str,
    admin_name: str,
    action_type: AdminActionType,
    target_type: str,
    target_id: str,
    before_value: Optional[Dict] = None,
    after_value: Optional[Dict] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Create immutable audit log entry"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin_id,
        "admin_name": admin_name,
        "action_type": action_type.value,
        "target_type": target_type,
        "target_id": target_id,
        "before_value": before_value,
        "after_value": after_value,
        "reason": reason,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log_entry)
    return log_entry

# ============ ADMIN DASHBOARD ROUTES ============

@api_router.get("/admin/dashboard-stats")
async def get_admin_dashboard_stats(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get comprehensive admin dashboard statistics"""
    
    # User counts by role
    total_farmers = await db.users.count_documents({"role": "farmer"})
    total_paravets = await db.users.count_documents({"role": "paravet"})
    total_vets = await db.users.count_documents({"role": "veterinarian"})
    total_animals = await db.animals.count_documents({})
    active_institutions = await db.institutions.count_documents({"is_verified": True})
    
    # Pending approvals
    pending_users = await db.users.count_documents({"is_active": False})
    pending_institutions = await db.institutions.count_documents({"is_verified": False})
    
    # Knowledge center stats
    knowledge_entries = await db.knowledge_center.count_documents({})
    draft_knowledge = await db.knowledge_center.count_documents({"status": "draft"})
    
    # Safety rules
    safety_rules = await db.safety_rules.count_documents({"is_active": True})
    
    # Recent activity
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    opd_cases_today = await db.opd_cases.count_documents({"case_date": {"$gte": today_start}})
    vaccinations_today = await db.vaccinations.count_documents({"date": {"$gte": today_start}})
    
    # Zoonotic alerts
    zoonotic_cases = await db.opd_cases.count_documents({
        "tentative_diagnosis": {"$regex": "|".join(HIGH_RISK_DISEASES), "$options": "i"},
        "result": {"$ne": "recovered"}
    })
    
    return {
        "users": {
            "total_farmers": total_farmers,
            "total_paravets": total_paravets,
            "total_vets": total_vets,
            "pending_approvals": pending_users
        },
        "animals": {
            "total": total_animals
        },
        "institutions": {
            "active": active_institutions,
            "pending_verification": pending_institutions
        },
        "knowledge_center": {
            "total_entries": knowledge_entries,
            "pending_drafts": draft_knowledge
        },
        "safety": {
            "active_rules": safety_rules,
            "zoonotic_alerts": zoonotic_cases
        },
        "activity": {
            "opd_cases_today": opd_cases_today,
            "vaccinations_today": vaccinations_today
        }
    }

@api_router.get("/admin/alerts")
async def get_admin_alerts(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get admin-specific alerts"""
    alerts = []
    
    # Pending user approvals
    pending_users = await db.users.find({"is_active": False}, {"_id": 0}).to_list(10)
    for pu in pending_users:
        alerts.append({
            "type": "user_approval",
            "severity": "info",
            "title": "Pending User Approval",
            "message": f"{pu.get('name')} ({pu.get('role')}) awaiting activation",
            "target_id": pu.get("id"),
            "date": pu.get("created_at")
        })
    
    # Pending institution verifications
    pending_inst = await db.institutions.find({"is_verified": False}, {"_id": 0}).to_list(10)
    for pi in pending_inst:
        alerts.append({
            "type": "institution_verification",
            "severity": "info",
            "title": "Institution Verification Pending",
            "message": f"{pi.get('institution_name')} awaiting verification",
            "target_id": pi.get("id"),
            "date": pi.get("created_at")
        })
    
    # Zoonotic disease alerts
    zoonotic_cases = await db.opd_cases.find({
        "tentative_diagnosis": {"$regex": "|".join(HIGH_RISK_DISEASES), "$options": "i"},
        "result": {"$ne": "recovered"}
    }, {"_id": 0}).to_list(10)
    
    for case in zoonotic_cases:
        alerts.append({
            "type": "zoonotic",
            "severity": "critical",
            "title": "Zoonotic Disease Outbreak Alert",
            "message": f"Case {case.get('case_number')} - {case.get('tentative_diagnosis')} in {case.get('farmer_village')}",
            "target_id": case.get("id"),
            "date": case.get("case_date")
        })
    
    # Draft knowledge entries pending review
    draft_entries = await db.knowledge_center.find({"status": "draft"}, {"_id": 0}).to_list(5)
    for de in draft_entries:
        alerts.append({
            "type": "knowledge_review",
            "severity": "warning",
            "title": "Knowledge Entry Pending Review",
            "message": f"{de.get('parameter_name')} for {de.get('species')} needs review",
            "target_id": de.get("id"),
            "date": de.get("updated_at")
        })
    
    return {"alerts": alerts, "total": len(alerts)}

# ============ USER MANAGEMENT ROUTES ============

@api_router.get("/admin/users")
async def get_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Get all users with optional filters"""
    query = {}
    
    if role:
        query["role"] = role
    if status == "active":
        query["is_active"] = True
    elif status == "inactive":
        query["is_active"] = False
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"village": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users

@api_router.get("/admin/users/{user_id}")
async def get_user_detail(user_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get detailed user information"""
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get additional profile info based on role
    if target_user["role"] == "veterinarian":
        vet_profile = await db.vet_profiles.find_one({"user_id": user_id}, {"_id": 0})
        target_user["vet_profile"] = vet_profile
    
    # Get activity stats
    if target_user["role"] == "farmer":
        animals_count = await db.animals.count_documents({"farmer_id": user_id})
        target_user["stats"] = {"animals": animals_count}
    elif target_user["role"] == "veterinarian":
        opd_count = await db.opd_cases.count_documents({"vet_id": user_id})
        target_user["stats"] = {"opd_cases": opd_count}
    
    return target_user

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    is_active: bool,
    reason: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Activate or deactivate a user"""
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user["role"] == "admin":
        raise HTTPException(status_code=403, detail="Cannot modify admin status")
    
    old_status = target_user.get("is_active")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": is_active, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.USER_ACTIVATE if is_active else AdminActionType.USER_DEACTIVATE,
        target_type="user",
        target_id=user_id,
        before_value={"is_active": old_status},
        after_value={"is_active": is_active},
        reason=reason
    )
    
    return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}

@api_router.put("/admin/users/{user_id}/lock")
async def lock_unlock_user(
    user_id: str,
    locked: bool,
    reason: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Lock or unlock a user account"""
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_locked": locked, "lock_reason": reason if locked else None}}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.USER_LOCK if locked else AdminActionType.USER_UNLOCK,
        target_type="user",
        target_id=user_id,
        before_value={"is_locked": target_user.get("is_locked", False)},
        after_value={"is_locked": locked},
        reason=reason
    )
    
    return {"message": f"User {'locked' if locked else 'unlocked'} successfully"}

@api_router.get("/admin/users/{user_id}/activity")
async def get_user_activity(user_id: str, user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get user activity logs (for farmers/paravets/vets)"""
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    activity = []
    
    if target_user["role"] == "farmer":
        # Get farmer's animal registrations, vaccinations, etc.
        animals = await db.animals.find({"farmer_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
        for a in animals:
            activity.append({
                "type": "animal_registration",
                "description": f"Registered animal: {a.get('tag_id')} ({a.get('species')})",
                "date": a.get("created_at")
            })
    
    elif target_user["role"] == "veterinarian":
        # Get vet's OPD cases
        cases = await db.opd_cases.find({"vet_id": user_id}, {"_id": 0}).sort("case_date", -1).to_list(20)
        for c in cases:
            activity.append({
                "type": "opd_case",
                "description": f"OPD Case: {c.get('case_number')} - {c.get('tentative_diagnosis')}",
                "date": c.get("case_date")
            })
    
    return {"user": target_user.get("name"), "role": target_user.get("role"), "activity": activity}

# ============ VET VERIFICATION ROUTES ============

@api_router.put("/admin/vets/{user_id}/verify-registration")
async def verify_vet_registration(
    user_id: str,
    verified: bool,
    remarks: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Verify veterinarian registration number"""
    vet_profile = await db.vet_profiles.find_one({"user_id": user_id})
    if not vet_profile:
        raise HTTPException(status_code=404, detail="Vet profile not found")
    
    await db.vet_profiles.update_one(
        {"user_id": user_id},
        {"$set": {
            "registration_verified": verified,
            "verification_date": datetime.now(timezone.utc).isoformat(),
            "verification_remarks": remarks,
            "verified_by": user["id"]
        }}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.USER_UPDATE,
        target_type="vet_profile",
        target_id=user_id,
        after_value={"registration_verified": verified, "remarks": remarks}
    )
    
    return {"message": f"Vet registration {'verified' if verified else 'rejected'}"}

@api_router.put("/admin/vets/{user_id}/certificate-privileges")
async def update_certificate_privileges(
    user_id: str,
    enabled: bool,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Enable or disable certificate generation privileges for a vet"""
    vet_profile = await db.vet_profiles.find_one({"user_id": user_id})
    if not vet_profile:
        raise HTTPException(status_code=404, detail="Vet profile not found")
    
    await db.vet_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"certificate_privileges": enabled}}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.USER_UPDATE,
        target_type="vet_profile",
        target_id=user_id,
        after_value={"certificate_privileges": enabled}
    )
    
    return {"message": f"Certificate privileges {'enabled' if enabled else 'disabled'}"}

# ============ INSTITUTION MANAGEMENT ============

@api_router.put("/admin/institutions/{institution_id}/verify")
async def verify_institution(
    institution_id: str,
    verified: bool,
    remarks: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Verify an institution"""
    institution = await db.institutions.find_one({"id": institution_id})
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    await db.institutions.update_one(
        {"id": institution_id},
        {"$set": {
            "is_verified": verified,
            "verification_date": datetime.now(timezone.utc).isoformat(),
            "verified_by": user["id"],
            "verification_remarks": remarks
        }}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.USER_UPDATE,
        target_type="institution",
        target_id=institution_id,
        after_value={"is_verified": verified}
    )
    
    return {"message": f"Institution {'verified' if verified else 'verification revoked'}"}

# ============ KNOWLEDGE CENTER MANAGEMENT ============

@api_router.post("/admin/knowledge")
async def create_knowledge_entry(
    entry: KnowledgeEntryCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create a new knowledge center entry"""
    entry_dict = entry.model_dump()
    entry_dict["id"] = str(uuid.uuid4())
    entry_dict["version"] = 1
    entry_dict["status"] = "draft"
    entry_dict["created_by"] = user["id"]
    entry_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    entry_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.knowledge_center.insert_one(entry_dict)
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.KNOWLEDGE_CREATE,
        target_type="knowledge",
        target_id=entry_dict["id"],
        after_value={"parameter_name": entry.parameter_name, "species": entry.species.value}
    )
    
    if "_id" in entry_dict:
        del entry_dict["_id"]
    return KnowledgeEntryResponse(**entry_dict)

@api_router.get("/admin/knowledge")
async def get_knowledge_entries(
    category: Optional[str] = None,
    species: Optional[Species] = None,
    status: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Get knowledge center entries with admin access"""
    query = {}
    if category:
        query["category"] = category
    if species:
        query["species"] = species.value
    if status:
        query["status"] = status
    
    entries = await db.knowledge_center.find(query, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return entries

@api_router.put("/admin/knowledge/{entry_id}")
async def update_knowledge_entry(
    entry_id: str,
    entry: KnowledgeEntryCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update a knowledge center entry (creates new version)"""
    existing = await db.knowledge_center.find_one({"id": entry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Archive old version
    old_version = existing.copy()
    old_version["_id"] = None
    old_version["id"] = str(uuid.uuid4())
    old_version["status"] = "archived"
    old_version["archived_at"] = datetime.now(timezone.utc).isoformat()
    await db.knowledge_center_history.insert_one(old_version)
    
    # Update current entry
    update_dict = entry.model_dump()
    update_dict["version"] = existing.get("version", 1) + 1
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["updated_by"] = user["id"]
    
    await db.knowledge_center.update_one({"id": entry_id}, {"$set": update_dict})
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.KNOWLEDGE_UPDATE,
        target_type="knowledge",
        target_id=entry_id,
        before_value={"version": existing.get("version")},
        after_value={"version": update_dict["version"]}
    )
    
    updated = await db.knowledge_center.find_one({"id": entry_id}, {"_id": 0})
    return updated

@api_router.put("/admin/knowledge/{entry_id}/publish")
async def publish_knowledge_entry(
    entry_id: str,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Publish a knowledge center entry"""
    existing = await db.knowledge_center.find_one({"id": entry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    await db.knowledge_center.update_one(
        {"id": entry_id},
        {"$set": {
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "published_by": user["id"]
        }}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.KNOWLEDGE_PUBLISH,
        target_type="knowledge",
        target_id=entry_id
    )
    
    return {"message": "Knowledge entry published"}

@api_router.put("/admin/knowledge/{entry_id}/archive")
async def archive_knowledge_entry(
    entry_id: str,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Archive a knowledge center entry (never delete)"""
    existing = await db.knowledge_center.find_one({"id": entry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    await db.knowledge_center.update_one(
        {"id": entry_id},
        {"$set": {
            "status": "archived",
            "archived_at": datetime.now(timezone.utc).isoformat(),
            "archived_by": user["id"]
        }}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.KNOWLEDGE_ARCHIVE,
        target_type="knowledge",
        target_id=entry_id
    )
    
    return {"message": "Knowledge entry archived"}

# ============ SAFETY RULES MANAGEMENT ============

@api_router.post("/admin/safety-rules")
async def create_safety_rule(
    rule: SafetyRuleCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create a new safety rule for zoonotic diseases"""
    rule_dict = rule.model_dump()
    rule_dict["id"] = str(uuid.uuid4())
    rule_dict["version"] = 1
    rule_dict["created_by"] = user["id"]
    rule_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    rule_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.safety_rules.insert_one(rule_dict)
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.SAFETY_RULE_CREATE,
        target_type="safety_rule",
        target_id=rule_dict["id"],
        after_value={"disease_name": rule.disease_name}
    )
    
    if "_id" in rule_dict:
        del rule_dict["_id"]
    return SafetyRuleResponse(**rule_dict)

@api_router.get("/admin/safety-rules")
async def get_safety_rules(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get all safety rules"""
    rules = await db.safety_rules.find({}, {"_id": 0}).to_list(100)
    return rules

@api_router.put("/admin/safety-rules/{rule_id}")
async def update_safety_rule(
    rule_id: str,
    rule: SafetyRuleCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update a safety rule"""
    existing = await db.safety_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_dict = rule.model_dump()
    update_dict["version"] = existing.get("version", 1) + 1
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["updated_by"] = user["id"]
    
    await db.safety_rules.update_one({"id": rule_id}, {"$set": update_dict})
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.SAFETY_RULE_UPDATE,
        target_type="safety_rule",
        target_id=rule_id,
        before_value={"version": existing.get("version")},
        after_value={"version": update_dict["version"]}
    )
    
    updated = await db.safety_rules.find_one({"id": rule_id}, {"_id": 0})
    return updated

@api_router.get("/safety-rules/{disease_name}")
async def get_safety_rule_by_disease(disease_name: str):
    """Get safety rules for a specific disease (public endpoint for vet/paravet)"""
    rule = await db.safety_rules.find_one(
        {"disease_name": {"$regex": disease_name, "$options": "i"}, "is_active": True},
        {"_id": 0}
    )
    return rule

# ============ AUDIT LOGS ============

@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    action_type: Optional[str] = None,
    target_type: Optional[str] = None,
    admin_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Get audit logs (immutable, read-only)"""
    query = {}
    
    if action_type:
        query["action_type"] = action_type
    if target_type:
        query["target_type"] = target_type
    if admin_id:
        query["admin_id"] = admin_id
    if date_from:
        query["timestamp"] = {"$gte": date_from}
    if date_to:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = date_to
        else:
            query["timestamp"] = {"$lte": date_to}
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return {"logs": logs, "total": len(logs)}

# ============ SYSTEM NOTIFICATIONS ============

@api_router.post("/admin/notifications")
async def create_notification(
    notification: SystemNotificationCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create a system-wide notification"""
    notif_dict = notification.model_dump()
    notif_dict["id"] = str(uuid.uuid4())
    notif_dict["created_by"] = user["id"]
    notif_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    notif_dict["read_count"] = 0
    
    await db.system_notifications.insert_one(notif_dict)
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.NOTIFICATION_SEND,
        target_type="notification",
        target_id=notif_dict["id"],
        after_value={"title": notification.title, "priority": notification.priority}
    )
    
    if "_id" in notif_dict:
        del notif_dict["_id"]
    return notif_dict

@api_router.get("/admin/notifications")
async def get_admin_notifications(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get all system notifications"""
    notifications = await db.system_notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.get("/notifications")
async def get_user_notifications(user: dict = Depends(get_current_user)):
    """Get notifications for current user"""
    query = {
        "$or": [
            {"target_roles": {"$size": 0}},  # All users
            {"target_roles": user.get("role")}
        ]
    }
    
    notifications = await db.system_notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)
    return notifications

# ============ SYSTEM SETTINGS ============

@api_router.get("/admin/settings")
async def get_system_settings(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get all system settings"""
    settings = await db.system_settings.find({}, {"_id": 0}).to_list(100)
    return settings

@api_router.put("/admin/settings/{key}")
async def update_system_setting(
    key: str,
    value: str,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update a system setting"""
    existing = await db.system_settings.find_one({"key": key})
    
    if existing:
        old_value = existing.get("value")
        await db.system_settings.update_one(
            {"key": key},
            {"$set": {"value": value, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.system_settings.insert_one({
            "key": key,
            "value": value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        old_value = None
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.SETTING_UPDATE,
        target_type="setting",
        target_id=key,
        before_value={"value": old_value},
        after_value={"value": value}
    )
    
    return {"message": f"Setting '{key}' updated"}

# ============ DATA LOCKING ============

@api_router.put("/admin/records/{record_type}/{record_id}/lock")
async def lock_record(
    record_type: str,
    record_id: str,
    locked: bool,
    reason: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Lock or unlock a record (OPD, IPD, etc.)"""
    collection_map = {
        "opd": "opd_cases",
        "ipd": "opd_cases",
        "vaccination": "vaccinations",
        "postmortem": "postmortem_records"
    }
    
    if record_type not in collection_map:
        raise HTTPException(status_code=400, detail="Invalid record type")
    
    collection = db[collection_map[record_type]]
    record = await collection.find_one({"id": record_id})
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    await collection.update_one(
        {"id": record_id},
        {"$set": {
            "is_locked": locked,
            "lock_reason": reason if locked else None,
            "locked_by": user["id"] if locked else None,
            "locked_at": datetime.now(timezone.utc).isoformat() if locked else None
        }}
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.RECORD_LOCK if locked else AdminActionType.RECORD_UNLOCK,
        target_type=record_type,
        target_id=record_id,
        reason=reason
    )
    
    return {"message": f"Record {'locked' if locked else 'unlocked'} successfully"}

# ============ REPORTS ============

@api_router.get("/admin/reports/user-activity")
async def get_user_activity_report(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    role: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Generate user activity report"""
    # This would aggregate data for reporting
    pipeline = [
        {"$group": {
            "_id": "$role",
            "count": {"$sum": 1},
            "active_count": {"$sum": {"$cond": ["$is_active", 1, 0]}}
        }}
    ]
    
    user_stats = await db.users.aggregate(pipeline).to_list(10)
    
    return {
        "report_type": "user_activity",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data": user_stats
    }

@api_router.get("/admin/reports/disease-surveillance")
async def get_disease_surveillance_report(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Generate disease surveillance report"""
    query = {}
    if date_from:
        query["case_date"] = {"$gte": date_from}
    if date_to:
        if "case_date" in query:
            query["case_date"]["$lte"] = date_to
        else:
            query["case_date"] = {"$lte": date_to}
    
    # Get cases by diagnosis
    pipeline = [
        {"$match": query} if query else {"$match": {}},
        {"$group": {
            "_id": "$tentative_diagnosis",
            "count": {"$sum": 1},
            "villages": {"$addToSet": "$farmer_village"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    disease_stats = await db.opd_cases.aggregate(pipeline).to_list(50)
    
    return {
        "report_type": "disease_surveillance",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data": disease_stats
    }

# ============ GVA & ECONOMIC ANALYSIS MODULE ============

# Default GVA calculation parameters (admin-configurable)
DEFAULT_GVA_SETTINGS = {
    "milk": {
        "breedable_percentage": 70,  # % of cattle+buffalo that are breedable
        "in_milk_percentage": 60,    # % of breedable that are in-milk
        "input_cost_percentage": 40   # % of GSDP as input cost
    },
    "sheep_goat": {
        "slaughter_rate": 45,        # % slaughtered
        "seasons_per_year": 3,       # number of seasons
        "input_cost_percentage": 20   # % of GSDP as input cost
    },
    "buffalo_meat": {
        "slaughter_rate": 25,        # % slaughtered
        "input_cost_percentage": 15   # % of GSDP as input cost
    },
    "poultry_meat": {
        "batches_per_year": 8,       # batches per year
        "slaughter_rate": 95,        # % slaughtered
        "dressing_percentage": 70,    # dressing %
        "input_cost_percentage": 45   # % of GSDP as input cost
    },
    "egg": {
        "input_cost_percentage": 40   # % of GSDP as input cost
    }
}

class GVAInputBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    # Livestock Census
    cattle_count: int = 0
    buffalo_count: int = 0
    sheep_count: int = 0
    goat_count: int = 0
    poultry_count: int = 0
    # Milk Parameters
    avg_milk_yield_per_day: float = 0  # litres per animal per day
    milk_price_per_litre: float = 0     # ₹
    # Meat Parameters
    avg_live_weight_kg: float = 0       # kg at slaughter
    meat_price_per_kg: float = 0        # ₹
    # Poultry & Egg Parameters
    eggs_per_bird_per_year: int = 0
    egg_price: float = 0                # ₹ per egg
    poultry_meat_price_per_kg: float = 0  # ₹
    # Location
    village_name: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None

class GVACalculationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    # Milk GVA
    milk_breedable_animals: int = 0
    milk_in_milk_animals: int = 0
    milk_daily_production: float = 0
    milk_annual_production: float = 0
    milk_gsdp: float = 0
    milk_input_cost: float = 0
    milk_gva: float = 0
    # Sheep & Goat Meat GVA
    sheep_goat_slaughter_count: int = 0
    sheep_goat_meat_production: float = 0
    sheep_goat_annual_meat: float = 0
    sheep_goat_gsdp: float = 0
    sheep_goat_input_cost: float = 0
    sheep_goat_gva: float = 0
    # Buffalo Meat GVA
    buffalo_slaughter_count: int = 0
    buffalo_meat_production: float = 0
    buffalo_gsdp: float = 0
    buffalo_input_cost: float = 0
    buffalo_meat_gva: float = 0
    # Poultry Meat GVA
    poultry_annual_birds: int = 0
    poultry_slaughter_count: int = 0
    poultry_dressed_meat: float = 0
    poultry_gsdp: float = 0
    poultry_input_cost: float = 0
    poultry_meat_gva: float = 0
    # Egg GVA
    egg_annual_production: int = 0
    egg_gsdp: float = 0
    egg_input_cost: float = 0
    egg_gva: float = 0
    # Total
    total_village_gva: float = 0

class GVAReportResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    inputs: GVAInputBase
    results: GVACalculationResult
    settings_used: Dict[str, Any]
    vet_id: str
    vet_name: str
    institution: Optional[str] = None
    created_at: str

@api_router.get("/gva/settings")
async def get_gva_settings(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Get GVA calculation settings (admin only)"""
    settings = await db.gva_settings.find_one({"type": "gva_parameters"}, {"_id": 0})
    if not settings:
        # Return defaults if not configured
        return DEFAULT_GVA_SETTINGS
    return settings.get("parameters", DEFAULT_GVA_SETTINGS)

@api_router.put("/gva/settings")
async def update_gva_settings(
    settings: Dict[str, Any],
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update GVA calculation settings (admin only)"""
    await db.gva_settings.update_one(
        {"type": "gva_parameters"},
        {"$set": {
            "parameters": settings,
            "updated_by": user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Log the action
    await log_admin_action(
        admin_id=user["id"],
        admin_name=user["name"],
        action_type=AdminActionType.SETTING_UPDATE,
        target_type="gva_settings",
        target_id="gva_parameters",
        after_value=settings
    )
    
    return {"message": "GVA settings updated successfully"}

def calculate_gva(inputs: GVAInputBase, settings: Dict[str, Any]) -> GVACalculationResult:
    """Core GVA calculation engine - all formulas implemented here"""
    result = GVACalculationResult()
    
    milk_settings = settings.get("milk", DEFAULT_GVA_SETTINGS["milk"])
    sheep_goat_settings = settings.get("sheep_goat", DEFAULT_GVA_SETTINGS["sheep_goat"])
    buffalo_settings = settings.get("buffalo_meat", DEFAULT_GVA_SETTINGS["buffalo_meat"])
    poultry_settings = settings.get("poultry_meat", DEFAULT_GVA_SETTINGS["poultry_meat"])
    egg_settings = settings.get("egg", DEFAULT_GVA_SETTINGS["egg"])
    
    # ====== MILK GVA ======
    total_dairy = inputs.cattle_count + inputs.buffalo_count
    result.milk_breedable_animals = int(total_dairy * milk_settings["breedable_percentage"] / 100)
    result.milk_in_milk_animals = int(result.milk_breedable_animals * milk_settings["in_milk_percentage"] / 100)
    result.milk_daily_production = result.milk_in_milk_animals * inputs.avg_milk_yield_per_day
    result.milk_annual_production = result.milk_daily_production * 365
    result.milk_gsdp = result.milk_annual_production * inputs.milk_price_per_litre
    result.milk_input_cost = result.milk_gsdp * milk_settings["input_cost_percentage"] / 100
    result.milk_gva = result.milk_gsdp - result.milk_input_cost
    
    # ====== SHEEP & GOAT MEAT GVA ======
    total_sheep_goat = inputs.sheep_count + inputs.goat_count
    result.sheep_goat_slaughter_count = int(total_sheep_goat * sheep_goat_settings["slaughter_rate"] / 100)
    result.sheep_goat_meat_production = result.sheep_goat_slaughter_count * inputs.avg_live_weight_kg
    result.sheep_goat_annual_meat = result.sheep_goat_meat_production * sheep_goat_settings["seasons_per_year"]
    result.sheep_goat_gsdp = result.sheep_goat_annual_meat * inputs.meat_price_per_kg
    result.sheep_goat_input_cost = result.sheep_goat_gsdp * sheep_goat_settings["input_cost_percentage"] / 100
    result.sheep_goat_gva = result.sheep_goat_gsdp - result.sheep_goat_input_cost
    
    # ====== BUFFALO MEAT GVA ======
    result.buffalo_slaughter_count = int(inputs.buffalo_count * buffalo_settings["slaughter_rate"] / 100)
    result.buffalo_meat_production = result.buffalo_slaughter_count * inputs.avg_live_weight_kg
    result.buffalo_gsdp = result.buffalo_meat_production * inputs.meat_price_per_kg
    result.buffalo_input_cost = result.buffalo_gsdp * buffalo_settings["input_cost_percentage"] / 100
    result.buffalo_meat_gva = result.buffalo_gsdp - result.buffalo_input_cost
    
    # ====== POULTRY MEAT GVA ======
    result.poultry_annual_birds = inputs.poultry_count * poultry_settings["batches_per_year"]
    result.poultry_slaughter_count = int(result.poultry_annual_birds * poultry_settings["slaughter_rate"] / 100)
    result.poultry_dressed_meat = result.poultry_slaughter_count * poultry_settings["dressing_percentage"] / 100
    result.poultry_gsdp = result.poultry_dressed_meat * inputs.poultry_meat_price_per_kg
    result.poultry_input_cost = result.poultry_gsdp * poultry_settings["input_cost_percentage"] / 100
    result.poultry_meat_gva = result.poultry_gsdp - result.poultry_input_cost
    
    # ====== EGG GVA ======
    result.egg_annual_production = inputs.poultry_count * inputs.eggs_per_bird_per_year
    result.egg_gsdp = result.egg_annual_production * inputs.egg_price
    result.egg_input_cost = result.egg_gsdp * egg_settings["input_cost_percentage"] / 100
    result.egg_gva = result.egg_gsdp - result.egg_input_cost
    
    # ====== TOTAL VILLAGE GVA ======
    result.total_village_gva = (
        result.milk_gva +
        result.sheep_goat_gva +
        result.buffalo_meat_gva +
        result.poultry_meat_gva +
        result.egg_gva
    )
    
    return result

@api_router.post("/gva/calculate")
async def calculate_gva_report(
    inputs: GVAInputBase,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    """Calculate GVA and save report"""
    # Get current settings
    settings_doc = await db.gva_settings.find_one({"type": "gva_parameters"}, {"_id": 0})
    settings = settings_doc.get("parameters", DEFAULT_GVA_SETTINGS) if settings_doc else DEFAULT_GVA_SETTINGS
    
    # Calculate GVA
    results = calculate_gva(inputs, settings)
    
    # Get vet profile for institution
    vet_profile = await db.vet_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    institution = vet_profile.get("institution_name") if vet_profile else None
    
    # Save report
    report = {
        "id": str(uuid.uuid4()),
        "inputs": inputs.model_dump(),
        "results": results.model_dump(),
        "settings_used": settings,
        "vet_id": user["id"],
        "vet_name": user["name"],
        "institution": institution,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gva_reports.insert_one(report)
    if "_id" in report:
        del report["_id"]
    
    return report

@api_router.get("/gva/reports")
async def get_gva_reports(
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN, UserRole.PARAVET]))
):
    """Get GVA reports history"""
    query = {}
    if user["role"] == "veterinarian":
        query["vet_id"] = user["id"]
    elif user["role"] == "paravet":
        # Paravets can only view, not create
        pass
    
    reports = await db.gva_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reports

@api_router.get("/gva/reports/{report_id}")
async def get_gva_report(
    report_id: str,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN, UserRole.PARAVET]))
):
    """Get specific GVA report"""
    report = await db.gva_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@api_router.get("/gva/reports/{report_id}/pdf")
async def generate_gva_pdf(
    report_id: str,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    """Generate PDF for GVA report"""
    report = await db.gva_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.units import inch
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=1,
            spaceAfter=12
        )
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            alignment=1,
            spaceAfter=20
        )
        section_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=12,
            spaceBefore=15,
            spaceAfter=8
        )
        
        elements = []
        
        # Title
        elements.append(Paragraph("SMART LIVESTOCK CARE (SLC)", title_style))
        elements.append(Paragraph("Village GVA Economic Report", subtitle_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Report Info
        inputs = report.get("inputs", {})
        info_data = [
            ["Report Date:", report.get("created_at", "")[:10]],
            ["Village:", inputs.get("village_name", "N/A")],
            ["Mandal:", inputs.get("mandal", "N/A")],
            ["District:", inputs.get("district", "N/A")],
            ["Vet Name:", report.get("vet_name", "N/A")],
            ["Institution:", report.get("institution", "N/A")],
        ]
        info_table = Table(info_data, colWidths=[1.5*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Livestock Census
        elements.append(Paragraph("LIVESTOCK CENSUS", section_style))
        census_data = [
            ["Species", "Count"],
            ["Cattle", str(inputs.get("cattle_count", 0))],
            ["Buffalo", str(inputs.get("buffalo_count", 0))],
            ["Sheep", str(inputs.get("sheep_count", 0))],
            ["Goat", str(inputs.get("goat_count", 0))],
            ["Poultry", str(inputs.get("poultry_count", 0))],
        ]
        census_table = Table(census_data, colWidths=[2*inch, 1.5*inch])
        census_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(census_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # GVA Results
        results = report.get("results", {})
        elements.append(Paragraph("GVA CALCULATION RESULTS", section_style))
        
        def format_currency(value):
            return f"₹ {value:,.2f}"
        
        gva_data = [
            ["Category", "GSDP (₹)", "Input Cost (₹)", "GVA (₹)"],
            ["Milk", format_currency(results.get("milk_gsdp", 0)), format_currency(results.get("milk_input_cost", 0)), format_currency(results.get("milk_gva", 0))],
            ["Sheep & Goat Meat", format_currency(results.get("sheep_goat_gsdp", 0)), format_currency(results.get("sheep_goat_input_cost", 0)), format_currency(results.get("sheep_goat_gva", 0))],
            ["Buffalo Meat", format_currency(results.get("buffalo_gsdp", 0)), format_currency(results.get("buffalo_input_cost", 0)), format_currency(results.get("buffalo_meat_gva", 0))],
            ["Poultry Meat", format_currency(results.get("poultry_gsdp", 0)), format_currency(results.get("poultry_input_cost", 0)), format_currency(results.get("poultry_meat_gva", 0))],
            ["Eggs", format_currency(results.get("egg_gsdp", 0)), format_currency(results.get("egg_input_cost", 0)), format_currency(results.get("egg_gva", 0))],
        ]
        gva_table = Table(gva_data, colWidths=[1.8*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        gva_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(gva_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Total GVA
        total_data = [
            ["TOTAL VILLAGE GVA", format_currency(results.get("total_village_gva", 0))],
        ]
        total_table = Table(total_data, colWidths=[4.3*inch, 2*inch])
        total_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#dc2626')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(total_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # Disclaimer
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1
        )
        elements.append(Paragraph(
            "DISCLAIMER: These calculations are planning estimates only. "
            "Final economic decisions depend on local conditions. "
            "This report is generated by Smart Livestock Care (SLC) for reference purposes.",
            disclaimer_style
        ))
        
        doc.build(elements)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=GVA_Report_{report_id[:8]}.pdf"
            }
        )
        
    except ImportError:
        # Fallback if reportlab not available
        return {"error": "PDF generation requires reportlab library", "report": report}

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
