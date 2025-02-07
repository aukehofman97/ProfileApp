from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Profile(BaseModel):
    fields: list

@app.post("/api/profile")
async def save_profile(profile: Profile):
    print("Received profile:", profile)
    return {"message": "Profile saved!", "data": profile}