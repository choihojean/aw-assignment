from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, links
from database import engine, Base

Base.metadata.create_all(bind=engine)

#기본 구조
app = FastAPI(title="워크 포털 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(links.router, prefix="/links", tags=["Links"])

@app.get("/")
def home():
    return {"message":"워크 포털 실행 중"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port = 8000)