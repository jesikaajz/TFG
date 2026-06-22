from pydantic import BaseModel


class ProgrammingLanguageBase(BaseModel):
    name: str
    version: str


class ProgrammingLanguageCreate(ProgrammingLanguageBase):
    pass


class ProgrammingLanguagePatch(BaseModel):
    name: str | None = None
    version: str | None = None


class ProgrammingLanguageResponse(ProgrammingLanguageBase):
    id: int

    model_config = {
        "from_attributes": True
    }