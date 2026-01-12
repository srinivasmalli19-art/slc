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

# ============ VACCINATION REGISTER MODELS ============

class VaccinationRouteEnum(str, Enum):
    SUBCUTANEOUS = "subcutaneous"
    INTRAMUSCULAR = "intramuscular"
    INTRADERMAL = "intradermal"
    ORAL = "oral"
    INTRANASAL = "intranasal"
    INTRAVENOUS = "intravenous"

class VaccinationBase(BaseModel):
    animal_type: str  # "large" or "small"
    tag_number: str
    farmer_name: str
    farmer_id: Optional[str] = None
    farmer_village: str
    farmer_phone: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    vaccine_name: str
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    dose_rate: str
    dose_given: Optional[str] = None
    route: str = "intramuscular"
    vaccination_date: Optional[str] = None
    next_due_date: Optional[str] = None
    flock_size: Optional[int] = None  # For small animals only
    animals_vaccinated: Optional[int] = 1
    adverse_reaction: Optional[str] = None
    remarks: Optional[str] = None

class VaccinationCreate(VaccinationBase):
    pass

class VaccinationResponse(VaccinationBase):
    id: str
    serial_number: int
    case_number: str
    vet_id: str
    vet_name: str
    institution_name: Optional[str] = None
    created_at: str
    updated_at: str

# ============ DEWORMING REGISTER MODELS ============

class DewormingBase(BaseModel):
    tag_number: str
    farmer_name: str
    farmer_id: Optional[str] = None
    farmer_village: str
    farmer_phone: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    body_weight_kg: Optional[float] = None
    drug_used: str
    drug_batch: Optional[str] = None
    dose_rate: str
    dose_given: str
    route: str = "oral"
    deworming_date: Optional[str] = None
    next_due_date: Optional[str] = None
    result: str = "completed"
    fecal_sample_taken: bool = False
    epg_before: Optional[int] = None
    epg_after: Optional[int] = None
    remarks: Optional[str] = None

class DewormingCreate(DewormingBase):
    pass

class DewormingResponse(DewormingBase):
    id: str
    serial_number: int
    case_number: str
    vet_id: str
    vet_name: str
    institution_name: Optional[str] = None
    created_at: str
    updated_at: str

# ============ AI REGISTER MODELS (CRITICAL - 25+ FIELDS) ============

class AIRegisterBase(BaseModel):
    # Location Details
    village: str
    mandal: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    
    # Semen Straw Details
    ss_number: str  # Semen Straw Number
    bull_id: Optional[str] = None
    bull_breed: Optional[str] = None
    semen_batch: Optional[str] = None
    semen_station: Optional[str] = None
    
    # Animal Details
    tag_number: str
    sire_number: Optional[str] = None
    species: str
    breed: Optional[str] = None
    age_years: Optional[int] = None
    parity: Optional[int] = None
    body_condition_score: Optional[float] = None
    milk_yield_liters: Optional[float] = None
    
    # Farmer Details
    farmer_name: str
    farmer_father_name: Optional[str] = None
    farmer_address: Optional[str] = None
    farmer_phone: str
    farmer_aadhaar: Optional[str] = None
    
    # AI Details
    ai_date: str
    ai_time: Optional[str] = None
    heat_symptoms: Optional[str] = None
    ai_attempt_number: int = 1  # 1st, 2nd, 3rd AI
    ai_type: str = "fresh"  # fresh, frozen
    straws_used: int = 1
    insemination_site: Optional[str] = None
    
    # Stock Details
    opening_balance: Optional[int] = None
    straws_received: Optional[int] = None
    straws_used_today: Optional[int] = None
    closing_balance: Optional[int] = None
    
    # Fee Details
    fee_amount: Optional[float] = None
    fee_receipt_number: Optional[str] = None
    fee_date: Optional[str] = None
    
    # Pregnancy Diagnosis
    pd_date: Optional[str] = None
    pd_result: Optional[str] = None  # positive, negative, repeat
    pd_days: Optional[int] = None
    
    # Calf Birth Details
    calf_birth_date: Optional[str] = None
    calf_sex: Optional[str] = None  # male, female
    calf_weight_kg: Optional[float] = None
    calf_tag_number: Optional[str] = None
    
    # Additional
    lh_count: Optional[int] = None  # Liquid Handling count
    lhiii_count: Optional[int] = None
    remarks: Optional[str] = None

class AIRegisterCreate(AIRegisterBase):
    pass

class AIRegisterResponse(AIRegisterBase):
    id: str
    serial_number: int
    case_number: str
    monthly_number: int
    yearly_number: int
    vet_id: str
    vet_name: str
    institution_name: Optional[str] = None
    created_at: str
    updated_at: str

# ============ CALF BIRTH REGISTER MODELS ============

class CalfBirthBase(BaseModel):
    farmer_name: str
    farmer_id: Optional[str] = None
    farmer_village: str
    farmer_phone: Optional[str] = None
    dam_tag_number: str
    dam_species: str
    dam_breed: Optional[str] = None
    sire_tag_number: Optional[str] = None
    sire_breed: Optional[str] = None
    ai_done_date: Optional[str] = None
    ai_case_number: Optional[str] = None
    expected_birth_date: Optional[str] = None
    actual_birth_date: str
    birth_type: str = "normal"  # normal, assisted, caesarean
    calf_sex: str  # male, female
    calf_weight_kg: Optional[float] = None
    calf_tag_number: Optional[str] = None
    calf_color: Optional[str] = None
    twins: bool = False
    stillborn: bool = False
    dam_condition: str = "good"
    calf_condition: str = "healthy"
    first_colostrum_time: Optional[str] = None
    remarks: Optional[str] = None

class CalfBirthCreate(CalfBirthBase):
    pass

class CalfBirthResponse(CalfBirthBase):
    id: str
    serial_number: int
    case_number: str
    vet_id: str
    vet_name: str
    registered_at: str
    created_at: str
    updated_at: str

# ============ OUTBREAK REGISTER MODELS ============

class OutbreakBase(BaseModel):
    outbreak_date: str
    disease_name: str
    disease_nature: str = "normal"  # normal, zoonotic, notifiable
    village: str
    mandal: Optional[str] = None
    district: Optional[str] = None
    species_affected: List[str]
    total_susceptible: int
    animals_affected: int
    animals_treated: int
    deaths: int = 0
    mortality_rate: Optional[float] = None
    morbidity_rate: Optional[float] = None
    source_of_infection: Optional[str] = None
    spread_pattern: Optional[str] = None
    control_measures: str
    vaccination_done: bool = False
    vaccination_count: Optional[int] = None
    ring_vaccination: bool = False
    quarantine_imposed: bool = False
    samples_collected: bool = False
    lab_results: Optional[str] = None
    reported_to_authorities: bool = False
    authority_report_date: Optional[str] = None
    outbreak_status: str = "active"  # active, contained, closed
    closure_date: Optional[str] = None
    economic_loss_estimate: Optional[float] = None
    remarks: Optional[str] = None

class OutbreakCreate(OutbreakBase):
    pass

class OutbreakResponse(OutbreakBase):
    id: str
    serial_number: int
    outbreak_number: str
    vet_id: str
    vet_name: str
    institution_name: Optional[str] = None
    created_at: str
    updated_at: str

# ============ LIVESTOCK MORTALITY REGISTER MODELS ============

class MortalityBase(BaseModel):
    death_date: str
    tag_number: str
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    sex: Optional[str] = None
    farmer_name: str
    farmer_id: Optional[str] = None
    farmer_village: str
    farmer_phone: Optional[str] = None
    cause_of_death: str
    cause_category: str  # disease, accident, predator, unknown, natural
    disease_suspected: Optional[str] = None
    symptoms_before_death: Optional[str] = None
    duration_of_illness: Optional[str] = None
    treatment_given: Optional[str] = None
    post_mortem_done: bool = False
    post_mortem_findings: Optional[str] = None
    samples_collected: bool = False
    lab_confirmation: Optional[str] = None
    disposal_method: str  # burial, burning, rendering
    disposal_supervised: bool = True
    insurance_claimed: bool = False
    insurance_amount: Optional[float] = None
    notified_to_authorities: bool = False
    outbreak_linked: bool = False
    outbreak_id: Optional[str] = None
    remarks: Optional[str] = None

class MortalityCreate(MortalityBase):
    pass

class MortalityResponse(MortalityBase):
    id: str
    serial_number: int
    case_number: str
    vet_id: str
    vet_name: str
    institution_name: Optional[str] = None
    created_at: str
    updated_at: str

# ============ POST-MORTEM REGISTER MODELS (SECTIONS A-I) ============

class PostMortemBase(BaseModel):
    # Section A: General Information
    pm_date: str
    pm_time: Optional[str] = None
    pm_location: str
    reference_number: Optional[str] = None
    purpose: str  # insurance, legal, diagnostic, routine
    
    # Section B: Owner Details
    owner_name: str
    owner_father_name: Optional[str] = None
    owner_address: str
    owner_village: str
    owner_mandal: Optional[str] = None
    owner_district: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_aadhaar: Optional[str] = None
    
    # Section C: Animal Identification
    tag_number: str
    species: str
    breed: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    sex: str
    color_markings: Optional[str] = None
    body_weight_kg: Optional[float] = None
    identification_marks: Optional[str] = None
    
    # Section D: Death Details
    death_date: str
    death_time: Optional[str] = None
    place_of_death: str
    found_dead: bool = False
    duration_of_illness: Optional[str] = None
    symptoms_observed: Optional[str] = None
    treatment_history: Optional[str] = None
    vaccination_history: Optional[str] = None
    feeding_history: Optional[str] = None
    
    # Section E: External Examination Findings
    body_condition: str
    rigor_mortis: str  # present, absent, partial
    bloating: str  # none, mild, moderate, severe
    discharge_from_orifices: Optional[str] = None
    skin_condition: Optional[str] = None
    mucous_membrane_color: Optional[str] = None
    eyes_condition: Optional[str] = None
    external_injuries: Optional[str] = None
    parasites_observed: Optional[str] = None
    other_external_findings: Optional[str] = None
    
    # Section F: Internal Examination Findings
    subcutaneous_tissue: Optional[str] = None
    musculature: Optional[str] = None
    lymph_nodes: Optional[str] = None
    respiratory_system: Optional[str] = None
    cardiovascular_system: Optional[str] = None
    digestive_system: Optional[str] = None
    liver_findings: Optional[str] = None
    spleen_findings: Optional[str] = None
    kidney_findings: Optional[str] = None
    reproductive_system: Optional[str] = None
    nervous_system: Optional[str] = None
    urinary_system: Optional[str] = None
    other_internal_findings: Optional[str] = None
    
    # Section G: Diagnosis
    gross_pathological_diagnosis: str
    probable_cause_of_death: str
    differential_diagnosis: Optional[str] = None
    final_diagnosis: Optional[str] = None
    
    # Section H: Sample Collection
    samples_collected: bool = False
    sample_types: Optional[List[str]] = None
    sample_preservation: Optional[str] = None
    lab_submission_date: Optional[str] = None
    lab_name: Optional[str] = None
    lab_results: Optional[str] = None
    
    # Section I: Disposal & Preventive Measures
    disposal_method: str
    disposal_location: Optional[str] = None
    disposal_supervised_by: Optional[str] = None
    disinfection_done: bool = True
    preventive_measures_advised: Optional[str] = None
    quarantine_advised: bool = False
    vaccination_advised: bool = False
    
    # Certification
    insurance_case: bool = False
    insurance_company: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    estimated_value: Optional[float] = None
    witnesses: Optional[str] = None
    photographs_taken: bool = False
    photograph_count: Optional[int] = None
    
    remarks: Optional[str] = None

class PostMortemCreate(PostMortemBase):
    pass

class PostMortemResponse(PostMortemBase):
    id: str
    serial_number: int
    pm_number: str
    vet_id: str
    vet_name: str
    vet_registration_number: Optional[str] = None
    institution_name: Optional[str] = None
    certificate_generated: bool = False
    certificate_date: Optional[str] = None
    created_at: str
    updated_at: str

# ============ STOCK REGISTER MODELS ============

class StockType(str, Enum):
    BIOLOGICAL = "biological"
    MEDICINE = "medicine"
    FODDER_SEED = "fodder_seed"
    FEED = "feed"
    EQUIPMENT = "equipment"
    CONSUMABLES = "consumables"

class StockEntryBase(BaseModel):
    stock_type: str
    item_name: str
    item_category: Optional[str] = None
    batch_number: str
    manufacturer: Optional[str] = None
    supplier: Optional[str] = None
    manufacture_date: Optional[str] = None
    expiry_date: str
    quantity_received: float
    unit: str  # vials, bottles, kg, packets, etc.
    unit_price: Optional[float] = None
    total_value: Optional[float] = None
    storage_location: Optional[str] = None
    storage_temperature: Optional[str] = None
    receipt_number: Optional[str] = None
    receipt_date: str
    current_stock: float
    minimum_stock_level: Optional[float] = None
    remarks: Optional[str] = None

class StockEntryCreate(StockEntryBase):
    pass

class StockEntryResponse(StockEntryBase):
    id: str
    serial_number: int
    stock_code: str
    is_expired: bool
    is_low_stock: bool
    created_by: str
    created_at: str
    updated_at: str

class StockTransactionBase(BaseModel):
    stock_id: str
    transaction_type: str  # issue, receive, return, dispose, adjust
    quantity: float
    purpose: Optional[str] = None
    issued_to: Optional[str] = None
    case_reference: Optional[str] = None  # Link to vaccination/AI/treatment
    remarks: Optional[str] = None

class StockTransactionCreate(StockTransactionBase):
    pass

class StockTransactionResponse(StockTransactionBase):
    id: str
    transaction_date: str
    balance_after: float
    created_by: str
    created_at: str

# ============ DISTRIBUTION REGISTER MODELS ============

class DistributionBase(BaseModel):
    distribution_type: str  # seed, feed
    item_name: str
    stock_id: Optional[str] = None
    batch_number: Optional[str] = None
    farmer_name: str
    farmer_id: Optional[str] = None
    farmer_aadhaar: Optional[str] = None
    farmer_phone: str
    farmer_village: str
    farmer_address: Optional[str] = None
    quantity_distributed: float
    unit: str
    rate_per_unit: Optional[float] = None
    total_amount: Optional[float] = None
    subsidy_amount: Optional[float] = None
    farmer_contribution: Optional[float] = None
    payment_mode: Optional[str] = None
    receipt_number: Optional[str] = None
    scheme_name: Optional[str] = None
    purpose: Optional[str] = None
    remarks: Optional[str] = None

class DistributionCreate(DistributionBase):
    pass

class DistributionResponse(DistributionBase):
    id: str
    serial_number: int
    distribution_number: str
    distribution_date: str
    distributed_by: str
    distributed_by_name: str
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

# ============ SURGICAL REGISTER ROUTES ============

async def generate_surgical_case_number():
    """Generate case number: SURG-YYYY-XXXXX"""
    year = datetime.now(timezone.utc).year
    count = await db.surgical_cases.count_documents({
        "case_number": {"$regex": f"^SURG-{year}-"}
    })
    return f"SURG-{year}-{str(count + 1).zfill(5)}"

@api_router.post("/vet/surgical", response_model=SurgicalCaseResponse)
async def create_surgical_case(case: SurgicalCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    case_dict = case.model_dump()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["case_number"] = await generate_surgical_case_number()
    year = datetime.now(timezone.utc).year
    count = await db.surgical_cases.count_documents({"case_number": {"$regex": f"^SURG-{year}-"}})
    case_dict["serial_number"] = count
    case_dict["vet_id"] = user["id"]
    case_dict["vet_name"] = user["name"]
    case_dict["surgery_date"] = datetime.now(timezone.utc).isoformat()
    case_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    case_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.surgical_cases.insert_one(case_dict)
    if "_id" in case_dict:
        del case_dict["_id"]
    return SurgicalCaseResponse(**case_dict)

@api_router.get("/vet/surgical", response_model=List[SurgicalCaseResponse])
async def get_surgical_cases(
    species: Optional[str] = None,
    surgery_type: Optional[str] = None,
    outcome: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {}
    if species and species != "all":
        query["species"] = species
    if surgery_type and surgery_type != "all":
        query["surgery_type"] = surgery_type
    if outcome and outcome != "all":
        query["outcome"] = outcome
    if date_from:
        query["surgery_date"] = {"$gte": date_from}
    if date_to:
        if "surgery_date" in query:
            query["surgery_date"]["$lte"] = date_to
        else:
            query["surgery_date"] = {"$lte": date_to}
    
    cases = await db.surgical_cases.find(query, {"_id": 0}).sort("serial_number", -1).to_list(1000)
    return [SurgicalCaseResponse(**c) for c in cases]

@api_router.get("/vet/surgical/{case_id}", response_model=SurgicalCaseResponse)
async def get_surgical_case(case_id: str, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    case = await db.surgical_cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Surgical case not found")
    return SurgicalCaseResponse(**case)

@api_router.put("/vet/surgical/{case_id}", response_model=SurgicalCaseResponse)
async def update_surgical_case(case_id: str, case: SurgicalCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    existing = await db.surgical_cases.find_one({"id": case_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Surgical case not found")
    
    update_dict = case.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.surgical_cases.update_one({"id": case_id}, {"$set": update_dict})
    updated = await db.surgical_cases.find_one({"id": case_id}, {"_id": 0})
    return SurgicalCaseResponse(**updated)

# ============ GYNAECOLOGY REGISTER ROUTES ============

async def generate_gynaecology_case_number():
    """Generate case number: GYN-YYYY-XXXXX"""
    year = datetime.now(timezone.utc).year
    count = await db.gynaecology_cases.count_documents({
        "case_number": {"$regex": f"^GYN-{year}-"}
    })
    return f"GYN-{year}-{str(count + 1).zfill(5)}"

@api_router.post("/vet/gynaecology", response_model=GynaecologyCaseResponse)
async def create_gynaecology_case(case: GynaecologyCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    case_dict = case.model_dump()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["case_number"] = await generate_gynaecology_case_number()
    year = datetime.now(timezone.utc).year
    count = await db.gynaecology_cases.count_documents({"case_number": {"$regex": f"^GYN-{year}-"}})
    case_dict["serial_number"] = count
    case_dict["vet_id"] = user["id"]
    case_dict["vet_name"] = user["name"]
    case_dict["case_date"] = datetime.now(timezone.utc).isoformat()
    case_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    case_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.gynaecology_cases.insert_one(case_dict)
    if "_id" in case_dict:
        del case_dict["_id"]
    return GynaecologyCaseResponse(**case_dict)

@api_router.get("/vet/gynaecology", response_model=List[GynaecologyCaseResponse])
async def get_gynaecology_cases(
    species: Optional[str] = None,
    condition: Optional[str] = None,
    result: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {}
    if species and species != "all":
        query["species"] = species
    if condition and condition != "all":
        query["condition"] = condition
    if result and result != "all":
        query["result"] = result
    if date_from:
        query["case_date"] = {"$gte": date_from}
    if date_to:
        if "case_date" in query:
            query["case_date"]["$lte"] = date_to
        else:
            query["case_date"] = {"$lte": date_to}
    
    cases = await db.gynaecology_cases.find(query, {"_id": 0}).sort("serial_number", -1).to_list(1000)
    return [GynaecologyCaseResponse(**c) for c in cases]

@api_router.get("/vet/gynaecology/{case_id}", response_model=GynaecologyCaseResponse)
async def get_gynaecology_case(case_id: str, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    case = await db.gynaecology_cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Gynaecology case not found")
    return GynaecologyCaseResponse(**case)

@api_router.put("/vet/gynaecology/{case_id}", response_model=GynaecologyCaseResponse)
async def update_gynaecology_case(case_id: str, case: GynaecologyCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    existing = await db.gynaecology_cases.find_one({"id": case_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Gynaecology case not found")
    
    update_dict = case.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.gynaecology_cases.update_one({"id": case_id}, {"$set": update_dict})
    updated = await db.gynaecology_cases.find_one({"id": case_id}, {"_id": 0})
    return GynaecologyCaseResponse(**updated)

# ============ CASTRATION REGISTER ROUTES ============

async def generate_castration_case_number():
    """Generate case number: CAST-YYYY-XXXXX"""
    year = datetime.now(timezone.utc).year
    count = await db.castration_cases.count_documents({
        "case_number": {"$regex": f"^CAST-{year}-"}
    })
    return f"CAST-{year}-{str(count + 1).zfill(5)}"

@api_router.post("/vet/castration", response_model=CastrationCaseResponse)
async def create_castration_case(case: CastrationCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    case_dict = case.model_dump()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["case_number"] = await generate_castration_case_number()
    year = datetime.now(timezone.utc).year
    count = await db.castration_cases.count_documents({"case_number": {"$regex": f"^CAST-{year}-"}})
    case_dict["serial_number"] = count
    case_dict["vet_id"] = user["id"]
    case_dict["vet_name"] = user["name"]
    case_dict["castration_date"] = datetime.now(timezone.utc).isoformat()
    case_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    case_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.castration_cases.insert_one(case_dict)
    if "_id" in case_dict:
        del case_dict["_id"]
    return CastrationCaseResponse(**case_dict)

@api_router.get("/vet/castration", response_model=List[CastrationCaseResponse])
async def get_castration_cases(
    species: Optional[str] = None,
    method: Optional[str] = None,
    outcome: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))
):
    query = {}
    if species and species != "all":
        query["species"] = species
    if method and method != "all":
        query["method"] = method
    if outcome and outcome != "all":
        query["outcome"] = outcome
    if date_from:
        query["castration_date"] = {"$gte": date_from}
    if date_to:
        if "castration_date" in query:
            query["castration_date"]["$lte"] = date_to
        else:
            query["castration_date"] = {"$lte": date_to}
    
    cases = await db.castration_cases.find(query, {"_id": 0}).sort("serial_number", -1).to_list(1000)
    return [CastrationCaseResponse(**c) for c in cases]

@api_router.get("/vet/castration/{case_id}", response_model=CastrationCaseResponse)
async def get_castration_case(case_id: str, user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.ADMIN]))):
    case = await db.castration_cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Castration case not found")
    return CastrationCaseResponse(**case)

@api_router.put("/vet/castration/{case_id}", response_model=CastrationCaseResponse)
async def update_castration_case(case_id: str, case: CastrationCaseCreate, user: dict = Depends(require_role([UserRole.VETERINARIAN]))):
    existing = await db.castration_cases.find_one({"id": case_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Castration case not found")
    
    update_dict = case.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.castration_cases.update_one({"id": case_id}, {"$set": update_dict})
    updated = await db.castration_cases.find_one({"id": case_id}, {"_id": 0})
    return CastrationCaseResponse(**updated)

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

# ============ RATION CALCULATOR & KNOWLEDGE CENTER MODELS ============

class FeedCategory(str, Enum):
    GREEN_FODDER_LEGUME = "green_fodder_legume"
    GREEN_FODDER_NON_LEGUME = "green_fodder_non_legume"
    TREE_FODDER = "tree_fodder"
    DRY_FODDER = "dry_fodder"
    CONCENTRATES = "concentrates"
    OIL_CAKES = "oil_cakes"
    BRANS = "brans"
    GRAINS = "grains"
    AGRO_INDUSTRIAL = "agro_industrial"
    MINERALS = "minerals"
    SUPPLEMENTS = "supplements"

class DiagnosticCategory(str, Enum):
    CBC = "cbc"
    BIOCHEMISTRY = "biochemistry"
    BLOOD_PARASITES = "blood_parasites"
    BRUCELLOSIS = "brucellosis"
    FMD_ANTIBODY = "fmd_antibody"
    PREGNANCY = "pregnancy"
    MINERAL_PROFILE = "mineral_profile"
    HORMONES = "hormones"
    FECAL = "fecal"
    MILK_TEST = "milk_test"
    URINE_TEST = "urine_test"
    NASAL = "nasal"
    SKIN_SCRAPING = "skin_scraping"

class DiseaseNature(str, Enum):
    NORMAL = "normal"
    ZOONOTIC = "zoonotic"
    NOTIFIABLE = "notifiable"
    EMERGENCY = "emergency"

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

# --- Feed Item Master Model ---
class FeedItemBase(BaseModel):
    name: str
    local_name: Optional[str] = None
    category: str
    applicable_species: List[str]  # Which species can use this feed
    dm_percentage: float  # Dry Matter %
    cp_percentage: float  # Crude Protein %
    dcp_percentage: Optional[float] = None  # Digestible Crude Protein %
    tdn_percentage: Optional[float] = None  # Total Digestible Nutrients %
    me_mcal: Optional[float] = None  # Metabolizable Energy (Mcal/kg)
    ndf_percentage: Optional[float] = None  # Neutral Detergent Fiber %
    adf_percentage: Optional[float] = None  # Acid Detergent Fiber %
    calcium_percentage: Optional[float] = None
    phosphorus_percentage: Optional[float] = None
    default_price_per_kg: Optional[float] = None
    max_inclusion_percentage: Optional[float] = None  # Safety limit
    warnings: Optional[List[str]] = []
    contraindicated_species: Optional[List[str]] = []
    is_toxic: bool = False
    toxicity_notes: Optional[str] = None
    is_active: bool = True

class FeedItemCreate(FeedItemBase):
    pass

class FeedItemResponse(FeedItemBase):
    id: str
    created_by: str
    created_at: str
    updated_at: str
    version: int = 1

# --- Species Nutrition Rules Model ---
class SpeciesNutritionRuleBase(BaseModel):
    species: str
    physiological_status: str  # e.g., "calf", "growing", "pregnant", "lactating_low", etc.
    dm_percentage_bw: float  # DM as % of body weight
    cp_requirement_percentage: float
    tdn_requirement_percentage: Optional[float] = None
    me_requirement_mcal: Optional[float] = None  # For dogs/cats
    roughage_min_percentage: Optional[float] = None
    concentrate_max_percentage: Optional[float] = None
    grain_max_percentage: Optional[float] = None  # For horses - colic prevention
    milk_allowance_dm_per_litre: Optional[float] = None  # Extra DM per litre milk
    pregnancy_surge_percentage: Optional[float] = None
    special_notes: Optional[str] = None
    is_active: bool = True

class SpeciesNutritionRuleCreate(SpeciesNutritionRuleBase):
    pass

class SpeciesNutritionRuleResponse(SpeciesNutritionRuleBase):
    id: str
    created_by: str
    created_at: str
    updated_at: str
    version: int = 1

# --- Diagnostic Test Master Model ---
class DiagnosticTestBase(BaseModel):
    name: str
    category: str  # DiagnosticCategory
    sample_type: str  # blood, dung, milk, urine, nasal, skin
    applicable_species: List[str]
    purpose: str
    disease_nature: str = "normal"  # normal, zoonotic, notifiable, emergency
    parameters: List[Dict[str, Any]]  # List of parameters with normal ranges
    interpretation_rules: Optional[Dict[str, Any]] = None  # Backend logic
    safety_block: Optional[Dict[str, Any]] = None  # Zoonotic/emergency info
    is_active: bool = True

class DiagnosticTestCreate(DiagnosticTestBase):
    pass

class DiagnosticTestResponse(DiagnosticTestBase):
    id: str
    created_by: str
    created_at: str
    updated_at: str
    version: int = 1

# --- Normal Range Model ---
class NormalRangeBase(BaseModel):
    test_id: str
    parameter_name: str
    unit: str
    species: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    reference_text: Optional[str] = None
    interpretation_high: Optional[str] = None
    interpretation_low: Optional[str] = None
    clinical_notes: Optional[str] = None

class NormalRangeCreate(NormalRangeBase):
    pass

class NormalRangeResponse(NormalRangeBase):
    id: str
    created_by: str
    created_at: str
    updated_at: str

# --- Ration Calculation Request/Response ---
class RationCalculationRequest(BaseModel):
    species: str
    body_weight_kg: float
    physiological_status: str
    milk_yield_liters: Optional[float] = None
    selected_feeds: List[str]  # List of feed IDs
    feed_prices: Optional[Dict[str, float]] = None  # Optional custom prices

class RationCalculationResponse(BaseModel):
    id: str
    species: str
    body_weight_kg: float
    physiological_status: str
    milk_yield_liters: Optional[float]
    dm_required_kg: float
    cp_required_g: float
    tdn_required_kg: Optional[float]
    suggested_ration: List[Dict[str, Any]]  # Feed quantities
    total_dm_provided_kg: float
    total_cp_provided_g: float
    total_tdn_provided_kg: Optional[float]
    protein_status: str  # "adequate", "deficient", "excess"
    energy_status: str
    daily_feed_cost: float
    cost_per_litre_milk: Optional[float]
    warnings: List[str]
    advice: List[str]
    nutrition_version_id: str
    calculated_at: str
    calculated_by: str
    user_role: str
    is_offline: bool = False

# --- Diagnostic Test Entry & Result ---
class DiagnosticEntryRequest(BaseModel):
    test_id: str
    animal_tag: Optional[str] = None
    species: str
    farmer_name: Optional[str] = None
    farmer_village: Optional[str] = None
    clinical_signs: Optional[Dict[str, bool]] = None
    parameter_values: Dict[str, float]  # Parameter name -> value

class DiagnosticResultResponse(BaseModel):
    id: str
    test_id: str
    test_name: str
    animal_tag: Optional[str]
    species: str
    farmer_name: Optional[str]
    parameter_results: List[Dict[str, Any]]  # Each param with value, status, interpretation
    overall_interpretation: str
    likely_conditions: List[str]
    risk_level: str
    suggested_actions: List[str]
    special_symptoms_to_check: List[str]
    safety_warnings: Optional[List[str]] = None
    is_zoonotic: bool = False
    is_notifiable: bool = False
    created_at: str
    created_by: str
    user_role: str

# ============ RATION CALCULATOR - ADMIN ROUTES ============

@api_router.get("/admin/feed-items", response_model=List[FeedItemResponse])
async def get_feed_items(
    category: Optional[str] = None,
    species: Optional[str] = None,
    is_active: Optional[bool] = True,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Get all feed items - Admin can edit, others read-only"""
    query = {}
    if category:
        query["category"] = category
    if species:
        query["applicable_species"] = species
    if is_active is not None:
        query["is_active"] = is_active
    
    items = await db.feed_items.find(query, {"_id": 0}).to_list(1000)
    return [FeedItemResponse(**item) for item in items]

@api_router.post("/admin/feed-items", response_model=FeedItemResponse)
async def create_feed_item(
    item: FeedItemCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create feed item - Admin only"""
    item_dict = item.model_dump()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["created_by"] = user["id"]
    item_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    item_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    item_dict["version"] = 1
    
    await db.feed_items.insert_one(item_dict)
    
    # Audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "role": user["role"],
        "action": "create",
        "target_type": "feed_item",
        "target_id": item_dict["id"],
        "after_value": item_dict,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    if "_id" in item_dict:
        del item_dict["_id"]
    return FeedItemResponse(**item_dict)

@api_router.put("/admin/feed-items/{item_id}", response_model=FeedItemResponse)
async def update_feed_item(
    item_id: str,
    item: FeedItemCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update feed item - Admin only, creates new version"""
    existing = await db.feed_items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Feed item not found")
    
    # Archive old version
    old_version = {**existing, "archived_at": datetime.now(timezone.utc).isoformat()}
    if "_id" in old_version:
        del old_version["_id"]
    await db.feed_items_archive.insert_one(old_version)
    
    update_dict = item.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["version"] = existing.get("version", 1) + 1
    
    await db.feed_items.update_one({"id": item_id}, {"$set": update_dict})
    
    # Audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "role": user["role"],
        "action": "update",
        "target_type": "feed_item",
        "target_id": item_id,
        "before_value": {k: v for k, v in existing.items() if k != "_id"},
        "after_value": update_dict,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    updated = await db.feed_items.find_one({"id": item_id}, {"_id": 0})
    return FeedItemResponse(**updated)

@api_router.get("/admin/nutrition-rules", response_model=List[SpeciesNutritionRuleResponse])
async def get_nutrition_rules(
    species: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Get species nutrition rules"""
    query = {"is_active": True}
    if species:
        query["species"] = species
    
    rules = await db.nutrition_rules.find(query, {"_id": 0}).to_list(1000)
    return [SpeciesNutritionRuleResponse(**rule) for rule in rules]

@api_router.post("/admin/nutrition-rules", response_model=SpeciesNutritionRuleResponse)
async def create_nutrition_rule(
    rule: SpeciesNutritionRuleCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create nutrition rule - Admin only"""
    rule_dict = rule.model_dump()
    rule_dict["id"] = str(uuid.uuid4())
    rule_dict["created_by"] = user["id"]
    rule_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    rule_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    rule_dict["version"] = 1
    
    await db.nutrition_rules.insert_one(rule_dict)
    
    if "_id" in rule_dict:
        del rule_dict["_id"]
    return SpeciesNutritionRuleResponse(**rule_dict)

@api_router.put("/admin/nutrition-rules/{rule_id}", response_model=SpeciesNutritionRuleResponse)
async def update_nutrition_rule(
    rule_id: str,
    rule: SpeciesNutritionRuleCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update nutrition rule - Admin only"""
    existing = await db.nutrition_rules.find_one({"id": rule_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Nutrition rule not found")
    
    # Archive old version
    old_version = {**existing, "archived_at": datetime.now(timezone.utc).isoformat()}
    if "_id" in old_version:
        del old_version["_id"]
    await db.nutrition_rules_archive.insert_one(old_version)
    
    update_dict = rule.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["version"] = existing.get("version", 1) + 1
    
    await db.nutrition_rules.update_one({"id": rule_id}, {"$set": update_dict})
    
    updated = await db.nutrition_rules.find_one({"id": rule_id}, {"_id": 0})
    return SpeciesNutritionRuleResponse(**updated)

# ============ RATION CALCULATOR - CALCULATION ENGINE ============

async def calculate_ration_internal(request: RationCalculationRequest, user: dict) -> Dict[str, Any]:
    """Internal ration calculation engine - species-specific logic"""
    species = request.species
    body_weight = request.body_weight_kg
    status = request.physiological_status
    milk_yield = request.milk_yield_liters or 0
    
    # Get nutrition rule for this species and status
    rule = await db.nutrition_rules.find_one({
        "species": species,
        "physiological_status": status,
        "is_active": True
    }, {"_id": 0})
    
    if not rule:
        # Default calculation if no specific rule
        rule = {
            "dm_percentage_bw": 3.0,
            "cp_requirement_percentage": 12,
            "tdn_requirement_percentage": 60,
            "roughage_min_percentage": 60,
            "concentrate_max_percentage": 40,
            "milk_allowance_dm_per_litre": 0.4
        }
    
    # Calculate base requirements
    dm_required = body_weight * (rule["dm_percentage_bw"] / 100)
    
    # Add milk allowance for lactating animals
    if milk_yield > 0 and rule.get("milk_allowance_dm_per_litre"):
        dm_required += milk_yield * rule["milk_allowance_dm_per_litre"]
    
    cp_required_g = dm_required * rule["cp_requirement_percentage"] * 10  # Convert to grams
    tdn_required = dm_required * (rule.get("tdn_requirement_percentage", 60) / 100)
    
    # Get selected feeds
    feeds = await db.feed_items.find({
        "id": {"$in": request.selected_feeds},
        "is_active": True
    }, {"_id": 0}).to_list(100)
    
    if not feeds:
        raise HTTPException(status_code=400, detail="No valid feeds selected")
    
    # Simple ration formulation (can be enhanced with linear programming)
    suggested_ration = []
    total_dm = 0
    total_cp = 0
    total_tdn = 0
    total_cost = 0
    warnings = []
    advice = []
    
    roughage_feeds = [f for f in feeds if f["category"] in ["green_fodder_legume", "green_fodder_non_legume", "dry_fodder", "tree_fodder"]]
    concentrate_feeds = [f for f in feeds if f["category"] in ["concentrates", "oil_cakes", "brans", "grains"]]
    mineral_feeds = [f for f in feeds if f["category"] in ["minerals", "supplements"]]
    
    # Calculate roughage portion (60-70% of DM typically)
    roughage_dm_target = dm_required * (rule.get("roughage_min_percentage", 60) / 100)
    concentrate_dm_target = dm_required - roughage_dm_target
    
    # Distribute among roughages
    if roughage_feeds:
        per_roughage_dm = roughage_dm_target / len(roughage_feeds)
        for feed in roughage_feeds:
            as_fed_kg = per_roughage_dm / (feed["dm_percentage"] / 100)
            price = request.feed_prices.get(feed["id"], feed.get("default_price_per_kg", 0)) if request.feed_prices else feed.get("default_price_per_kg", 0)
            cost = as_fed_kg * price
            
            dm_from_feed = per_roughage_dm
            cp_from_feed = dm_from_feed * feed["cp_percentage"] * 10
            tdn_from_feed = dm_from_feed * (feed.get("tdn_percentage", 50) / 100)
            
            suggested_ration.append({
                "feed_id": feed["id"],
                "feed_name": feed["name"],
                "category": feed["category"],
                "quantity_kg": round(as_fed_kg, 2),
                "dm_kg": round(dm_from_feed, 2),
                "cp_g": round(cp_from_feed, 1),
                "tdn_kg": round(tdn_from_feed, 2),
                "cost": round(cost, 2)
            })
            
            total_dm += dm_from_feed
            total_cp += cp_from_feed
            total_tdn += tdn_from_feed
            total_cost += cost
            
            # Check for warnings
            if feed.get("warnings"):
                warnings.extend(feed["warnings"])
    
    # Distribute among concentrates
    if concentrate_feeds and concentrate_dm_target > 0:
        per_concentrate_dm = concentrate_dm_target / len(concentrate_feeds)
        for feed in concentrate_feeds:
            # Check max inclusion
            max_inclusion = feed.get("max_inclusion_percentage")
            if max_inclusion:
                max_dm = dm_required * (max_inclusion / 100)
                per_concentrate_dm = min(per_concentrate_dm, max_dm)
            
            as_fed_kg = per_concentrate_dm / (feed["dm_percentage"] / 100)
            price = request.feed_prices.get(feed["id"], feed.get("default_price_per_kg", 0)) if request.feed_prices else feed.get("default_price_per_kg", 0)
            cost = as_fed_kg * price
            
            dm_from_feed = per_concentrate_dm
            cp_from_feed = dm_from_feed * feed["cp_percentage"] * 10
            tdn_from_feed = dm_from_feed * (feed.get("tdn_percentage", 70) / 100)
            
            suggested_ration.append({
                "feed_id": feed["id"],
                "feed_name": feed["name"],
                "category": feed["category"],
                "quantity_kg": round(as_fed_kg, 2),
                "dm_kg": round(dm_from_feed, 2),
                "cp_g": round(cp_from_feed, 1),
                "tdn_kg": round(tdn_from_feed, 2),
                "cost": round(cost, 2)
            })
            
            total_dm += dm_from_feed
            total_cp += cp_from_feed
            total_tdn += tdn_from_feed
            total_cost += cost
    
    # Add minerals (fixed amount)
    for feed in mineral_feeds:
        quantity = 0.05 if "salt" in feed["name"].lower() else 0.03  # 50g salt, 30g mineral mix
        price = request.feed_prices.get(feed["id"], feed.get("default_price_per_kg", 0)) if request.feed_prices else feed.get("default_price_per_kg", 0)
        cost = quantity * price
        
        suggested_ration.append({
            "feed_id": feed["id"],
            "feed_name": feed["name"],
            "category": feed["category"],
            "quantity_kg": round(quantity, 3),
            "dm_kg": round(quantity, 3),
            "cp_g": 0,
            "tdn_kg": 0,
            "cost": round(cost, 2)
        })
        total_cost += cost
    
    # Determine status
    protein_status = "adequate"
    if total_cp < cp_required_g * 0.9:
        protein_status = "deficient"
        advice.append("Protein is deficient. Consider adding more protein-rich concentrates like oil cakes.")
    elif total_cp > cp_required_g * 1.2:
        protein_status = "excess"
        advice.append("Protein is in excess. This may increase costs without benefit.")
    
    energy_status = "adequate"
    if total_tdn < tdn_required * 0.9:
        energy_status = "deficient"
        advice.append("Energy is deficient. Consider adding more energy-rich feeds.")
    elif total_tdn > tdn_required * 1.2:
        energy_status = "excess"
    
    cost_per_litre = round(total_cost / milk_yield, 2) if milk_yield > 0 else None
    
    # Get current nutrition version
    version_doc = await db.nutrition_versions.find_one({"is_current": True}, {"_id": 0})
    version_id = version_doc["id"] if version_doc else "default"
    
    result = {
        "id": str(uuid.uuid4()),
        "species": species,
        "body_weight_kg": body_weight,
        "physiological_status": status,
        "milk_yield_liters": milk_yield,
        "dm_required_kg": round(dm_required, 2),
        "cp_required_g": round(cp_required_g, 1),
        "tdn_required_kg": round(tdn_required, 2),
        "suggested_ration": suggested_ration,
        "total_dm_provided_kg": round(total_dm, 2),
        "total_cp_provided_g": round(total_cp, 1),
        "total_tdn_provided_kg": round(total_tdn, 2),
        "protein_status": protein_status,
        "energy_status": energy_status,
        "daily_feed_cost": round(total_cost, 2),
        "cost_per_litre_milk": cost_per_litre,
        "warnings": warnings,
        "advice": advice,
        "nutrition_version_id": version_id,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
        "calculated_by": user["id"],
        "user_role": user["role"],
        "is_offline": False
    }
    
    # Store calculation for audit
    await db.ration_calculations.insert_one(result)
    
    return result

@api_router.post("/ration/calculate", response_model=RationCalculationResponse)
async def calculate_ration(
    request: RationCalculationRequest,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET, UserRole.FARMER]))
):
    """Calculate ration for any species"""
    result = await calculate_ration_internal(request, user)
    if "_id" in result:
        del result["_id"]
    return RationCalculationResponse(**result)

@api_router.get("/ration/calculations", response_model=List[RationCalculationResponse])
async def get_ration_calculations(
    species: Optional[str] = None,
    limit: int = 100,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Get ration calculation history - Admin only for full audit"""
    query = {}
    if species:
        query["species"] = species
    
    calculations = await db.ration_calculations.find(query, {"_id": 0}).sort("calculated_at", -1).limit(limit).to_list(limit)
    return [RationCalculationResponse(**calc) for calc in calculations]

# ============ KNOWLEDGE CENTER - DIAGNOSTIC TESTS ROUTES ============

@api_router.get("/admin/diagnostic-tests", response_model=List[DiagnosticTestResponse])
async def get_diagnostic_tests(
    category: Optional[str] = None,
    species: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Get diagnostic tests - All roles can view"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    if species:
        query["applicable_species"] = species
    
    tests = await db.diagnostic_tests.find(query, {"_id": 0}).to_list(1000)
    return [DiagnosticTestResponse(**test) for test in tests]

@api_router.post("/admin/diagnostic-tests", response_model=DiagnosticTestResponse)
async def create_diagnostic_test(
    test: DiagnosticTestCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create diagnostic test - Admin only"""
    test_dict = test.model_dump()
    test_dict["id"] = str(uuid.uuid4())
    test_dict["created_by"] = user["id"]
    test_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    test_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    test_dict["version"] = 1
    
    await db.diagnostic_tests.insert_one(test_dict)
    
    # Audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "role": user["role"],
        "action": "create",
        "target_type": "diagnostic_test",
        "target_id": test_dict["id"],
        "after_value": {k: v for k, v in test_dict.items() if k != "_id"},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    if "_id" in test_dict:
        del test_dict["_id"]
    return DiagnosticTestResponse(**test_dict)

@api_router.put("/admin/diagnostic-tests/{test_id}", response_model=DiagnosticTestResponse)
async def update_diagnostic_test(
    test_id: str,
    test: DiagnosticTestCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update diagnostic test - Admin only, creates new version"""
    existing = await db.diagnostic_tests.find_one({"id": test_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    
    # Archive old version
    old_version = {**existing, "archived_at": datetime.now(timezone.utc).isoformat()}
    if "_id" in old_version:
        del old_version["_id"]
    await db.diagnostic_tests_archive.insert_one(old_version)
    
    update_dict = test.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["version"] = existing.get("version", 1) + 1
    
    await db.diagnostic_tests.update_one({"id": test_id}, {"$set": update_dict})
    
    # Audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "role": user["role"],
        "action": "update",
        "target_type": "diagnostic_test",
        "target_id": test_id,
        "before_value": {k: v for k, v in existing.items() if k != "_id"},
        "after_value": update_dict,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    updated = await db.diagnostic_tests.find_one({"id": test_id}, {"_id": 0})
    return DiagnosticTestResponse(**updated)

@api_router.get("/admin/normal-ranges", response_model=List[NormalRangeResponse])
async def get_normal_ranges(
    test_id: Optional[str] = None,
    species: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Get normal ranges for diagnostic tests"""
    query = {}
    if test_id:
        query["test_id"] = test_id
    if species:
        query["species"] = species
    
    ranges = await db.normal_ranges.find(query, {"_id": 0}).to_list(1000)
    return [NormalRangeResponse(**r) for r in ranges]

@api_router.post("/admin/normal-ranges", response_model=NormalRangeResponse)
async def create_normal_range(
    range_data: NormalRangeCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Create normal range - Admin only"""
    range_dict = range_data.model_dump()
    range_dict["id"] = str(uuid.uuid4())
    range_dict["created_by"] = user["id"]
    range_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    range_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.normal_ranges.insert_one(range_dict)
    
    if "_id" in range_dict:
        del range_dict["_id"]
    return NormalRangeResponse(**range_dict)

@api_router.put("/admin/normal-ranges/{range_id}", response_model=NormalRangeResponse)
async def update_normal_range(
    range_id: str,
    range_data: NormalRangeCreate,
    user: dict = Depends(require_role([UserRole.ADMIN]))
):
    """Update normal range - Admin only"""
    existing = await db.normal_ranges.find_one({"id": range_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Normal range not found")
    
    update_dict = range_data.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.normal_ranges.update_one({"id": range_id}, {"$set": update_dict})
    
    updated = await db.normal_ranges.find_one({"id": range_id}, {"_id": 0})
    return NormalRangeResponse(**updated)

# ============ DIAGNOSTIC INTERPRETATION ENGINE ============

async def interpret_diagnostic(entry: DiagnosticEntryRequest, user: dict) -> Dict[str, Any]:
    """Interpret diagnostic test results"""
    test = await db.diagnostic_tests.find_one({"id": entry.test_id, "is_active": True}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    
    # Get normal ranges for this test and species
    normal_ranges = await db.normal_ranges.find({
        "test_id": entry.test_id,
        "species": entry.species
    }, {"_id": 0}).to_list(100)
    
    ranges_dict = {r["parameter_name"]: r for r in normal_ranges}
    
    parameter_results = []
    abnormal_params = []
    
    for param_name, value in entry.parameter_values.items():
        range_info = ranges_dict.get(param_name, {})
        min_val = range_info.get("min_value")
        max_val = range_info.get("max_value")
        
        status = "normal"
        interpretation = ""
        
        if min_val is not None and value < min_val:
            status = "low"
            interpretation = range_info.get("interpretation_low", "Below normal range")
            abnormal_params.append({"param": param_name, "status": "low", "value": value})
        elif max_val is not None and value > max_val:
            status = "high"
            interpretation = range_info.get("interpretation_high", "Above normal range")
            abnormal_params.append({"param": param_name, "status": "high", "value": value})
        else:
            interpretation = "Within normal limits"
        
        parameter_results.append({
            "parameter": param_name,
            "value": value,
            "unit": range_info.get("unit", ""),
            "normal_range": f"{min_val or '-'} - {max_val or '-'}",
            "status": status,
            "interpretation": interpretation
        })
    
    # Determine overall interpretation
    if not abnormal_params:
        overall_interpretation = "All parameters within normal limits"
        risk_level = "low"
        likely_conditions = []
    else:
        overall_interpretation = f"{len(abnormal_params)} parameter(s) outside normal range"
        risk_level = "moderate" if len(abnormal_params) <= 2 else "high"
        likely_conditions = ["Requires further investigation"]
    
    # Check for zoonotic/emergency conditions
    is_zoonotic = test.get("disease_nature") == "zoonotic"
    is_notifiable = test.get("disease_nature") == "notifiable"
    safety_warnings = []
    
    if is_zoonotic:
        safety_warnings = [
            "⚠️ ZOONOTIC DISEASE RISK - Use appropriate PPE",
            "Isolate animal immediately",
            "Report to authorities as required",
            "Handle samples with extreme care"
        ]
        risk_level = "critical"
    
    suggested_actions = []
    if risk_level == "low":
        suggested_actions = ["Continue routine monitoring", "No immediate action required"]
    elif risk_level == "moderate":
        suggested_actions = ["Repeat test in 1-2 weeks", "Monitor clinical signs", "Consider additional tests"]
    elif risk_level == "high":
        suggested_actions = ["Immediate veterinary attention required", "Consider treatment protocol", "Isolate if infectious suspected"]
    else:  # critical
        suggested_actions = ["IMMEDIATE ACTION REQUIRED", "Contact veterinary authorities", "Implement biosecurity measures"]
    
    result = {
        "id": str(uuid.uuid4()),
        "test_id": entry.test_id,
        "test_name": test["name"],
        "animal_tag": entry.animal_tag,
        "species": entry.species,
        "farmer_name": entry.farmer_name,
        "parameter_results": parameter_results,
        "overall_interpretation": overall_interpretation,
        "likely_conditions": likely_conditions,
        "risk_level": risk_level,
        "suggested_actions": suggested_actions,
        "special_symptoms_to_check": test.get("safety_block", {}).get("symptoms_to_check", []),
        "safety_warnings": safety_warnings if safety_warnings else None,
        "is_zoonotic": is_zoonotic,
        "is_notifiable": is_notifiable,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
        "user_role": user["role"]
    }
    
    # Store for audit
    await db.diagnostic_results.insert_one(result)
    
    return result

@api_router.post("/diagnostics/interpret", response_model=DiagnosticResultResponse)
async def interpret_test(
    entry: DiagnosticEntryRequest,
    user: dict = Depends(require_role([UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Interpret diagnostic test results - Vet/Paravet only"""
    result = await interpret_diagnostic(entry, user)
    if "_id" in result:
        del result["_id"]
    return DiagnosticResultResponse(**result)

@api_router.get("/diagnostics/results", response_model=List[DiagnosticResultResponse])
async def get_diagnostic_results(
    species: Optional[str] = None,
    test_id: Optional[str] = None,
    limit: int = 100,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Get diagnostic results history"""
    query = {}
    if species:
        query["species"] = species
    if test_id:
        query["test_id"] = test_id
    
    # Non-admin users only see their own results
    if user["role"] not in ["admin"]:
        query["created_by"] = user["id"]
    
    results = await db.diagnostic_results.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [DiagnosticResultResponse(**r) for r in results]

@api_router.get("/diagnostics/results/{result_id}", response_model=DiagnosticResultResponse)
async def get_diagnostic_result(
    result_id: str,
    user: dict = Depends(require_role([UserRole.ADMIN, UserRole.VETERINARIAN, UserRole.PARAVET]))
):
    """Get specific diagnostic result"""
    result = await db.diagnostic_results.find_one({"id": result_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return DiagnosticResultResponse(**result)

# ============ SEED DATA ENDPOINT FOR INITIAL SETUP ============

@api_router.post("/admin/seed-nutrition-data")
async def seed_nutrition_data(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Seed initial feed items and nutrition rules - Admin only"""
    
    # Check if already seeded
    existing_feeds = await db.feed_items.count_documents({})
    if existing_feeds > 0:
        return {"message": "Data already seeded", "feed_items": existing_feeds}
    
    # Seed Feed Items
    feed_items = [
        # Green Fodder - Legume
        {"name": "Lucerne (Alfalfa)", "local_name": "Rijka", "category": "green_fodder_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey", "camel"], "dm_percentage": 22, "cp_percentage": 18, "dcp_percentage": 14, "tdn_percentage": 58, "default_price_per_kg": 4},
        {"name": "Berseem", "local_name": "Berseem", "category": "green_fodder_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey"], "dm_percentage": 15, "cp_percentage": 17, "dcp_percentage": 13, "tdn_percentage": 60, "default_price_per_kg": 3},
        {"name": "Cowpea Fodder", "local_name": "Lobia Chara", "category": "green_fodder_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat"], "dm_percentage": 18, "cp_percentage": 16, "dcp_percentage": 12, "tdn_percentage": 55, "default_price_per_kg": 4},
        
        # Green Fodder - Non-Legume
        {"name": "Napier Grass", "local_name": "Elephant Grass", "category": "green_fodder_non_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey", "camel"], "dm_percentage": 20, "cp_percentage": 8, "dcp_percentage": 5, "tdn_percentage": 55, "default_price_per_kg": 2},
        {"name": "Maize Fodder", "local_name": "Makka Chara", "category": "green_fodder_non_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig"], "dm_percentage": 22, "cp_percentage": 9, "dcp_percentage": 6, "tdn_percentage": 62, "default_price_per_kg": 3},
        {"name": "Sorghum Fodder", "local_name": "Jowar Chara", "category": "green_fodder_non_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat"], "dm_percentage": 25, "cp_percentage": 7, "dcp_percentage": 4, "tdn_percentage": 58, "default_price_per_kg": 2, "warnings": ["May contain HCN in young plants"]},
        {"name": "Bajra Fodder", "local_name": "Bajra Chara", "category": "green_fodder_non_legume", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "camel"], "dm_percentage": 24, "cp_percentage": 8, "dcp_percentage": 5, "tdn_percentage": 56, "default_price_per_kg": 2},
        
        # Tree Fodder
        {"name": "Subabul Leaves", "local_name": "Subabul", "category": "tree_fodder", "applicable_species": ["cattle", "buffalo", "sheep", "goat"], "dm_percentage": 30, "cp_percentage": 24, "dcp_percentage": 18, "tdn_percentage": 55, "default_price_per_kg": 5, "max_inclusion_percentage": 30, "warnings": ["Limit to 30% of diet - contains mimosine"]},
        {"name": "Neem Leaves", "local_name": "Neem Patti", "category": "tree_fodder", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "camel"], "dm_percentage": 35, "cp_percentage": 15, "dcp_percentage": 10, "tdn_percentage": 45, "default_price_per_kg": 2},
        {"name": "Khejri Leaves", "local_name": "Khejri", "category": "tree_fodder", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "camel"], "dm_percentage": 40, "cp_percentage": 14, "dcp_percentage": 10, "tdn_percentage": 50, "default_price_per_kg": 3},
        
        # Dry Fodder
        {"name": "Wheat Straw", "local_name": "Gehun Bhusa", "category": "dry_fodder", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey", "camel"], "dm_percentage": 90, "cp_percentage": 3, "dcp_percentage": 0, "tdn_percentage": 42, "default_price_per_kg": 4},
        {"name": "Paddy Straw", "local_name": "Dhan Pual", "category": "dry_fodder", "applicable_species": ["cattle", "buffalo"], "dm_percentage": 90, "cp_percentage": 4, "dcp_percentage": 0, "tdn_percentage": 40, "default_price_per_kg": 3},
        {"name": "Groundnut Hay", "local_name": "Moongfali Bhusa", "category": "dry_fodder", "applicable_species": ["cattle", "buffalo", "sheep", "goat"], "dm_percentage": 88, "cp_percentage": 10, "dcp_percentage": 6, "tdn_percentage": 52, "default_price_per_kg": 8},
        
        # Concentrates - Oil Cakes
        {"name": "Groundnut Cake", "local_name": "Moongfali Khali", "category": "oil_cakes", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig"], "dm_percentage": 92, "cp_percentage": 45, "dcp_percentage": 40, "tdn_percentage": 78, "default_price_per_kg": 45},
        {"name": "Mustard Cake", "local_name": "Sarson Khali", "category": "oil_cakes", "applicable_species": ["cattle", "buffalo", "sheep", "goat"], "dm_percentage": 90, "cp_percentage": 35, "dcp_percentage": 30, "tdn_percentage": 75, "default_price_per_kg": 35},
        {"name": "Cotton Seed Cake", "local_name": "Binola Khali", "category": "oil_cakes", "applicable_species": ["cattle", "buffalo"], "dm_percentage": 92, "cp_percentage": 25, "dcp_percentage": 20, "tdn_percentage": 72, "default_price_per_kg": 30, "max_inclusion_percentage": 25, "warnings": ["Contains gossypol - limit for young animals"]},
        {"name": "Soybean Meal", "local_name": "Soya Khali", "category": "oil_cakes", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "poultry", "dog", "cat"], "dm_percentage": 90, "cp_percentage": 48, "dcp_percentage": 44, "tdn_percentage": 82, "default_price_per_kg": 50},
        
        # Brans
        {"name": "Wheat Bran", "local_name": "Chokar", "category": "brans", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey"], "dm_percentage": 88, "cp_percentage": 15, "dcp_percentage": 11, "tdn_percentage": 65, "default_price_per_kg": 18},
        {"name": "Rice Bran", "local_name": "Rice Bran", "category": "brans", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig"], "dm_percentage": 90, "cp_percentage": 13, "dcp_percentage": 9, "tdn_percentage": 60, "default_price_per_kg": 15},
        {"name": "De-oiled Rice Bran", "local_name": "DORB", "category": "brans", "applicable_species": ["cattle", "buffalo", "sheep", "goat"], "dm_percentage": 92, "cp_percentage": 15, "dcp_percentage": 10, "tdn_percentage": 55, "default_price_per_kg": 12},
        
        # Grains
        {"name": "Maize Grain", "local_name": "Makka Dana", "category": "grains", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "poultry", "horse", "donkey"], "dm_percentage": 88, "cp_percentage": 9, "dcp_percentage": 7, "tdn_percentage": 80, "default_price_per_kg": 22},
        {"name": "Barley", "local_name": "Jau", "category": "grains", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey"], "dm_percentage": 89, "cp_percentage": 11, "dcp_percentage": 8, "tdn_percentage": 75, "default_price_per_kg": 20},
        {"name": "Oats", "local_name": "Jai", "category": "grains", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey"], "dm_percentage": 89, "cp_percentage": 12, "dcp_percentage": 9, "tdn_percentage": 70, "default_price_per_kg": 25},
        
        # Minerals
        {"name": "Mineral Mixture", "local_name": "Mineral Mixture", "category": "minerals", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey", "camel"], "dm_percentage": 100, "cp_percentage": 0, "tdn_percentage": 0, "default_price_per_kg": 80, "calcium_percentage": 24, "phosphorus_percentage": 12},
        {"name": "Common Salt", "local_name": "Namak", "category": "minerals", "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey", "camel", "dog", "cat"], "dm_percentage": 100, "cp_percentage": 0, "tdn_percentage": 0, "default_price_per_kg": 15},
        
        # Pet Food (Dog/Cat)
        {"name": "Chicken Meal", "local_name": "Chicken Meal", "category": "concentrates", "applicable_species": ["dog", "cat"], "dm_percentage": 92, "cp_percentage": 65, "me_mcal": 3.5, "default_price_per_kg": 80},
        {"name": "Fish Meal", "local_name": "Fish Meal", "category": "concentrates", "applicable_species": ["dog", "cat", "pig", "poultry"], "dm_percentage": 92, "cp_percentage": 60, "me_mcal": 3.2, "default_price_per_kg": 70},
        {"name": "Rice (Cooked)", "local_name": "Chawal", "category": "grains", "applicable_species": ["dog", "cat"], "dm_percentage": 35, "cp_percentage": 3, "me_mcal": 1.3, "default_price_per_kg": 40},
    ]
    
    for feed in feed_items:
        feed["id"] = str(uuid.uuid4())
        feed["created_by"] = user["id"]
        feed["created_at"] = datetime.now(timezone.utc).isoformat()
        feed["updated_at"] = datetime.now(timezone.utc).isoformat()
        feed["version"] = 1
        feed["is_active"] = True
        if "warnings" not in feed:
            feed["warnings"] = []
        if "contraindicated_species" not in feed:
            feed["contraindicated_species"] = []
        feed["is_toxic"] = False
    
    await db.feed_items.insert_many(feed_items)
    
    # Seed Nutrition Rules
    nutrition_rules = [
        # Buffalo
        {"species": "buffalo", "physiological_status": "calf", "dm_percentage_bw": 2.5, "cp_requirement_percentage": 18, "tdn_requirement_percentage": 70, "roughage_min_percentage": 50, "concentrate_max_percentage": 50},
        {"species": "buffalo", "physiological_status": "growing", "dm_percentage_bw": 3.0, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 65, "roughage_min_percentage": 55, "concentrate_max_percentage": 45},
        {"species": "buffalo", "physiological_status": "heifer", "dm_percentage_bw": 2.8, "cp_requirement_percentage": 12, "tdn_requirement_percentage": 60, "roughage_min_percentage": 60, "concentrate_max_percentage": 40},
        {"species": "buffalo", "physiological_status": "pregnant", "dm_percentage_bw": 3.2, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 65, "roughage_min_percentage": 55, "concentrate_max_percentage": 45, "pregnancy_surge_percentage": 15},
        {"species": "buffalo", "physiological_status": "lactating_low", "dm_percentage_bw": 3.5, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 65, "roughage_min_percentage": 55, "concentrate_max_percentage": 45, "milk_allowance_dm_per_litre": 0.4},
        {"species": "buffalo", "physiological_status": "lactating_medium", "dm_percentage_bw": 4.0, "cp_requirement_percentage": 16, "tdn_requirement_percentage": 68, "roughage_min_percentage": 50, "concentrate_max_percentage": 50, "milk_allowance_dm_per_litre": 0.4},
        {"species": "buffalo", "physiological_status": "lactating_high", "dm_percentage_bw": 4.5, "cp_requirement_percentage": 18, "tdn_requirement_percentage": 70, "roughage_min_percentage": 45, "concentrate_max_percentage": 55, "milk_allowance_dm_per_litre": 0.45},
        {"species": "buffalo", "physiological_status": "dry", "dm_percentage_bw": 2.5, "cp_requirement_percentage": 10, "tdn_requirement_percentage": 55, "roughage_min_percentage": 70, "concentrate_max_percentage": 30},
        
        # Cattle (similar to buffalo with slight variations)
        {"species": "cattle", "physiological_status": "calf", "dm_percentage_bw": 2.5, "cp_requirement_percentage": 18, "tdn_requirement_percentage": 72, "roughage_min_percentage": 45, "concentrate_max_percentage": 55},
        {"species": "cattle", "physiological_status": "growing", "dm_percentage_bw": 2.8, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 66, "roughage_min_percentage": 55, "concentrate_max_percentage": 45},
        {"species": "cattle", "physiological_status": "lactating_low", "dm_percentage_bw": 3.2, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 65, "roughage_min_percentage": 55, "concentrate_max_percentage": 45, "milk_allowance_dm_per_litre": 0.35},
        {"species": "cattle", "physiological_status": "lactating_high", "dm_percentage_bw": 4.0, "cp_requirement_percentage": 18, "tdn_requirement_percentage": 72, "roughage_min_percentage": 40, "concentrate_max_percentage": 60, "milk_allowance_dm_per_litre": 0.4},
        
        # Sheep
        {"species": "sheep", "physiological_status": "maintenance", "dm_percentage_bw": 3.5, "cp_requirement_percentage": 10, "tdn_requirement_percentage": 55, "roughage_min_percentage": 70, "concentrate_max_percentage": 30},
        {"species": "sheep", "physiological_status": "pregnant", "dm_percentage_bw": 4.0, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 62, "roughage_min_percentage": 60, "concentrate_max_percentage": 40, "pregnancy_surge_percentage": 20},
        {"species": "sheep", "physiological_status": "lactating", "dm_percentage_bw": 4.5, "cp_requirement_percentage": 16, "tdn_requirement_percentage": 65, "roughage_min_percentage": 55, "concentrate_max_percentage": 45},
        
        # Goat
        {"species": "goat", "physiological_status": "maintenance", "dm_percentage_bw": 4.0, "cp_requirement_percentage": 10, "tdn_requirement_percentage": 55, "roughage_min_percentage": 70, "concentrate_max_percentage": 30},
        {"species": "goat", "physiological_status": "pregnant", "dm_percentage_bw": 4.5, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 62, "roughage_min_percentage": 60, "concentrate_max_percentage": 40, "pregnancy_surge_percentage": 25},
        {"species": "goat", "physiological_status": "lactating", "dm_percentage_bw": 5.0, "cp_requirement_percentage": 16, "tdn_requirement_percentage": 65, "roughage_min_percentage": 55, "concentrate_max_percentage": 45},
        
        # Horse - with grain limits for colic prevention
        {"species": "horse", "physiological_status": "maintenance", "dm_percentage_bw": 2.0, "cp_requirement_percentage": 10, "tdn_requirement_percentage": 55, "roughage_min_percentage": 70, "concentrate_max_percentage": 30, "grain_max_percentage": 0.5, "special_notes": "Grain should not exceed 0.5% of BW per meal to prevent colic"},
        {"species": "horse", "physiological_status": "working_light", "dm_percentage_bw": 2.2, "cp_requirement_percentage": 10, "tdn_requirement_percentage": 60, "roughage_min_percentage": 65, "concentrate_max_percentage": 35, "grain_max_percentage": 0.5},
        {"species": "horse", "physiological_status": "working_heavy", "dm_percentage_bw": 2.5, "cp_requirement_percentage": 12, "tdn_requirement_percentage": 68, "roughage_min_percentage": 55, "concentrate_max_percentage": 45, "grain_max_percentage": 0.5},
        
        # Donkey
        {"species": "donkey", "physiological_status": "maintenance", "dm_percentage_bw": 1.8, "cp_requirement_percentage": 8, "tdn_requirement_percentage": 50, "roughage_min_percentage": 80, "concentrate_max_percentage": 20, "special_notes": "Donkeys are efficient converters - prone to obesity"},
        {"species": "donkey", "physiological_status": "working", "dm_percentage_bw": 2.2, "cp_requirement_percentage": 10, "tdn_requirement_percentage": 55, "roughage_min_percentage": 70, "concentrate_max_percentage": 30},
        
        # Camel - high roughage efficiency
        {"species": "camel", "physiological_status": "maintenance", "dm_percentage_bw": 2.5, "cp_requirement_percentage": 8, "tdn_requirement_percentage": 50, "roughage_min_percentage": 85, "concentrate_max_percentage": 15, "special_notes": "Camels have superior roughage digestion efficiency"},
        {"species": "camel", "physiological_status": "lactating", "dm_percentage_bw": 3.5, "cp_requirement_percentage": 12, "tdn_requirement_percentage": 58, "roughage_min_percentage": 75, "concentrate_max_percentage": 25, "milk_allowance_dm_per_litre": 0.3},
        
        # Pig - CP-driven concentrate logic
        {"species": "pig", "physiological_status": "grower", "dm_percentage_bw": 4.0, "cp_requirement_percentage": 18, "tdn_requirement_percentage": 75, "roughage_min_percentage": 10, "concentrate_max_percentage": 90, "special_notes": "Pigs are monogastric - high concentrate diet"},
        {"species": "pig", "physiological_status": "finisher", "dm_percentage_bw": 3.5, "cp_requirement_percentage": 14, "tdn_requirement_percentage": 78, "roughage_min_percentage": 10, "concentrate_max_percentage": 90},
        {"species": "pig", "physiological_status": "lactating_sow", "dm_percentage_bw": 5.0, "cp_requirement_percentage": 16, "tdn_requirement_percentage": 75, "roughage_min_percentage": 15, "concentrate_max_percentage": 85},
        
        # Dog - ME-based (Metabolizable Energy)
        {"species": "dog", "physiological_status": "maintenance", "dm_percentage_bw": 2.5, "cp_requirement_percentage": 18, "me_requirement_mcal": 0.13, "roughage_min_percentage": 0, "concentrate_max_percentage": 100, "special_notes": "ME requirement = 130 kcal × BW^0.75"},
        {"species": "dog", "physiological_status": "working", "dm_percentage_bw": 3.5, "cp_requirement_percentage": 25, "me_requirement_mcal": 0.18, "roughage_min_percentage": 0, "concentrate_max_percentage": 100},
        {"species": "dog", "physiological_status": "lactating", "dm_percentage_bw": 4.5, "cp_requirement_percentage": 28, "me_requirement_mcal": 0.20, "roughage_min_percentage": 0, "concentrate_max_percentage": 100},
        
        # Cat - ME-based, obligate carnivore
        {"species": "cat", "physiological_status": "maintenance", "dm_percentage_bw": 3.0, "cp_requirement_percentage": 26, "me_requirement_mcal": 0.08, "roughage_min_percentage": 0, "concentrate_max_percentage": 100, "special_notes": "Cats are obligate carnivores - require taurine"},
        {"species": "cat", "physiological_status": "lactating", "dm_percentage_bw": 5.0, "cp_requirement_percentage": 35, "me_requirement_mcal": 0.12, "roughage_min_percentage": 0, "concentrate_max_percentage": 100},
    ]
    
    for rule in nutrition_rules:
        rule["id"] = str(uuid.uuid4())
        rule["created_by"] = user["id"]
        rule["created_at"] = datetime.now(timezone.utc).isoformat()
        rule["updated_at"] = datetime.now(timezone.utc).isoformat()
        rule["version"] = 1
        rule["is_active"] = True
    
    await db.nutrition_rules.insert_many(nutrition_rules)
    
    # Create nutrition version
    version = {
        "id": str(uuid.uuid4()),
        "version_name": "v1.0.0",
        "description": "Initial ICAR-aligned nutrition data",
        "is_current": True,
        "published_by": user["id"],
        "published_at": datetime.now(timezone.utc).isoformat()
    }
    await db.nutrition_versions.insert_one(version)
    
    return {
        "message": "Nutrition data seeded successfully",
        "feed_items": len(feed_items),
        "nutrition_rules": len(nutrition_rules),
        "version": version["version_name"]
    }

@api_router.post("/admin/seed-diagnostic-data")
async def seed_diagnostic_data(user: dict = Depends(require_role([UserRole.ADMIN]))):
    """Seed initial diagnostic tests and normal ranges - Admin only"""
    
    existing_tests = await db.diagnostic_tests.count_documents({})
    if existing_tests > 0:
        return {"message": "Data already seeded", "diagnostic_tests": existing_tests}
    
    # Seed Diagnostic Tests
    diagnostic_tests = [
        # CBC
        {
            "name": "Complete Blood Count (CBC)",
            "category": "cbc",
            "sample_type": "blood",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey", "camel", "dog", "cat"],
            "purpose": "Evaluate overall health, detect infections, anemia, and blood disorders",
            "disease_nature": "normal",
            "parameters": [
                {"name": "Hemoglobin", "unit": "g/dL"},
                {"name": "PCV", "unit": "%"},
                {"name": "RBC", "unit": "million/µL"},
                {"name": "WBC", "unit": "thousand/µL"},
                {"name": "Platelets", "unit": "thousand/µL"},
                {"name": "Neutrophils", "unit": "%"},
                {"name": "Lymphocytes", "unit": "%"},
                {"name": "Monocytes", "unit": "%"},
                {"name": "Eosinophils", "unit": "%"}
            ]
        },
        # Biochemistry
        {
            "name": "Blood Biochemistry",
            "category": "biochemistry",
            "sample_type": "blood",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey", "camel", "dog", "cat"],
            "purpose": "Assess organ function, metabolic status, and nutritional state",
            "disease_nature": "normal",
            "parameters": [
                {"name": "Blood Glucose", "unit": "mg/dL"},
                {"name": "BUN", "unit": "mg/dL"},
                {"name": "Creatinine", "unit": "mg/dL"},
                {"name": "Total Protein", "unit": "g/dL"},
                {"name": "Albumin", "unit": "g/dL"},
                {"name": "Globulin", "unit": "g/dL"},
                {"name": "AST (SGOT)", "unit": "U/L"},
                {"name": "ALT (SGPT)", "unit": "U/L"},
                {"name": "ALP", "unit": "U/L"},
                {"name": "Total Bilirubin", "unit": "mg/dL"}
            ]
        },
        # Brucellosis - ZOONOTIC
        {
            "name": "Brucellosis Test (RBPT/ELISA)",
            "category": "brucellosis",
            "sample_type": "blood",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "dog"],
            "purpose": "Detect Brucella infection - ZOONOTIC DISEASE",
            "disease_nature": "zoonotic",
            "parameters": [
                {"name": "RBPT", "unit": "result"},
                {"name": "ELISA Titer", "unit": "ratio"}
            ],
            "safety_block": {
                "ppe_required": ["Gloves", "Face mask", "Eye protection", "Lab coat"],
                "isolation_required": True,
                "milk_restriction": "Do not consume milk from positive animals",
                "meat_restriction": "Meat should not enter food chain",
                "government_reporting": True,
                "symptoms_to_check": ["Abortion", "Retained placenta", "Orchitis", "Joint swelling", "Infertility"]
            }
        },
        # FMD Antibody
        {
            "name": "FMD Antibody Test",
            "category": "fmd_antibody",
            "sample_type": "blood",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig"],
            "purpose": "Detect Foot and Mouth Disease antibodies - NOTIFIABLE DISEASE",
            "disease_nature": "notifiable",
            "parameters": [
                {"name": "FMD NSP ELISA", "unit": "result"},
                {"name": "Antibody Titer", "unit": "ratio"}
            ],
            "safety_block": {
                "isolation_required": True,
                "movement_restriction": True,
                "government_reporting": True,
                "symptoms_to_check": ["Vesicles on mouth", "Vesicles on feet", "Lameness", "Salivation", "Fever"]
            }
        },
        # Pregnancy Test
        {
            "name": "Pregnancy Diagnosis",
            "category": "pregnancy",
            "sample_type": "blood",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey", "camel", "dog", "cat"],
            "purpose": "Confirm pregnancy status",
            "disease_nature": "normal",
            "parameters": [
                {"name": "PAG (Pregnancy Associated Glycoprotein)", "unit": "ng/mL"},
                {"name": "Progesterone", "unit": "ng/mL"}
            ]
        },
        # Mineral Profile
        {
            "name": "Mineral Profile",
            "category": "mineral_profile",
            "sample_type": "blood",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey", "camel"],
            "purpose": "Assess mineral status and detect deficiencies",
            "disease_nature": "normal",
            "parameters": [
                {"name": "Calcium", "unit": "mg/dL"},
                {"name": "Phosphorus", "unit": "mg/dL"},
                {"name": "Magnesium", "unit": "mg/dL"},
                {"name": "Copper", "unit": "µg/dL"},
                {"name": "Zinc", "unit": "µg/dL"},
                {"name": "Iron", "unit": "µg/dL"}
            ]
        },
        # Fecal Examination
        {
            "name": "Fecal Examination (Parasitology)",
            "category": "fecal",
            "sample_type": "dung",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "pig", "horse", "donkey", "camel", "dog", "cat"],
            "purpose": "Detect internal parasites",
            "disease_nature": "normal",
            "parameters": [
                {"name": "EPG (Eggs per gram)", "unit": "count"},
                {"name": "Coccidia Oocysts", "unit": "OPG"},
                {"name": "Strongyle eggs", "unit": "present/absent"},
                {"name": "Fasciola eggs", "unit": "present/absent"},
                {"name": "Amphistome eggs", "unit": "present/absent"}
            ]
        },
        # Milk Test
        {
            "name": "Milk Quality Test",
            "category": "milk_test",
            "sample_type": "milk",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "camel"],
            "purpose": "Assess milk quality and detect mastitis",
            "disease_nature": "normal",
            "parameters": [
                {"name": "SCC (Somatic Cell Count)", "unit": "cells/mL"},
                {"name": "Fat", "unit": "%"},
                {"name": "SNF", "unit": "%"},
                {"name": "Protein", "unit": "%"},
                {"name": "CMT Score", "unit": "score"}
            ]
        },
        # Skin Scraping
        {
            "name": "Skin Scraping Examination",
            "category": "skin_scraping",
            "sample_type": "skin",
            "applicable_species": ["cattle", "buffalo", "sheep", "goat", "horse", "donkey", "camel", "dog", "cat"],
            "purpose": "Detect external parasites and fungal infections",
            "disease_nature": "normal",
            "parameters": [
                {"name": "Sarcoptes mites", "unit": "present/absent"},
                {"name": "Demodex mites", "unit": "present/absent"},
                {"name": "Dermatophytes", "unit": "present/absent"},
                {"name": "Lice", "unit": "present/absent"}
            ]
        }
    ]
    
    for test in diagnostic_tests:
        test["id"] = str(uuid.uuid4())
        test["created_by"] = user["id"]
        test["created_at"] = datetime.now(timezone.utc).isoformat()
        test["updated_at"] = datetime.now(timezone.utc).isoformat()
        test["version"] = 1
        test["is_active"] = True
    
    await db.diagnostic_tests.insert_many(diagnostic_tests)
    
    # Seed Normal Ranges for CBC - Cattle/Buffalo
    normal_ranges = []
    
    # CBC normal ranges for large ruminants
    cbc_test_id = [t for t in diagnostic_tests if t["name"] == "Complete Blood Count (CBC)"][0]["id"]
    
    for species in ["cattle", "buffalo"]:
        normal_ranges.extend([
            {"test_id": cbc_test_id, "parameter_name": "Hemoglobin", "unit": "g/dL", "species": species, "min_value": 8, "max_value": 15, "interpretation_high": "Possible dehydration or polycythemia", "interpretation_low": "Anemia - check for parasites, hemorrhage, or nutritional deficiency"},
            {"test_id": cbc_test_id, "parameter_name": "PCV", "unit": "%", "species": species, "min_value": 24, "max_value": 46, "interpretation_high": "Dehydration or stress", "interpretation_low": "Anemia"},
            {"test_id": cbc_test_id, "parameter_name": "RBC", "unit": "million/µL", "species": species, "min_value": 5, "max_value": 10, "interpretation_high": "Polycythemia", "interpretation_low": "Anemia"},
            {"test_id": cbc_test_id, "parameter_name": "WBC", "unit": "thousand/µL", "species": species, "min_value": 4, "max_value": 12, "interpretation_high": "Infection, inflammation, or stress", "interpretation_low": "Viral infection or bone marrow suppression"},
            {"test_id": cbc_test_id, "parameter_name": "Platelets", "unit": "thousand/µL", "species": species, "min_value": 100, "max_value": 800, "interpretation_high": "Reactive thrombocytosis", "interpretation_low": "Risk of bleeding"},
        ])
    
    # CBC for dogs
    normal_ranges.extend([
        {"test_id": cbc_test_id, "parameter_name": "Hemoglobin", "unit": "g/dL", "species": "dog", "min_value": 12, "max_value": 18, "interpretation_high": "Dehydration", "interpretation_low": "Anemia"},
        {"test_id": cbc_test_id, "parameter_name": "PCV", "unit": "%", "species": "dog", "min_value": 37, "max_value": 55, "interpretation_high": "Dehydration", "interpretation_low": "Anemia"},
        {"test_id": cbc_test_id, "parameter_name": "WBC", "unit": "thousand/µL", "species": "dog", "min_value": 6, "max_value": 17, "interpretation_high": "Infection or inflammation", "interpretation_low": "Viral infection"},
    ])
    
    for range_item in normal_ranges:
        range_item["id"] = str(uuid.uuid4())
        range_item["created_by"] = user["id"]
        range_item["created_at"] = datetime.now(timezone.utc).isoformat()
        range_item["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.normal_ranges.insert_many(normal_ranges)
    
    return {
        "message": "Diagnostic data seeded successfully",
        "diagnostic_tests": len(diagnostic_tests),
        "normal_ranges": len(normal_ranges)
    }

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
