from pydantic import BaseModel, EmailStr, constr

PasswordStr = constr(min_length=8, strip_whitespace=True, pattern=r"^\S+$")


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    password_change_required: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: PasswordStr