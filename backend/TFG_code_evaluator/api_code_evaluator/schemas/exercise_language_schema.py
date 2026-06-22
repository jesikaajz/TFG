from pydantic import BaseModel


class ExerciseLanguageBase(BaseModel):
    exercise_id: int
    language_id: int


class ExerciseLanguageCreate(ExerciseLanguageBase):
    pass


class ExerciseLanguageResponse(ExerciseLanguageBase):

    model_config = {
        "from_attributes": True
    }