# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Unit: auth DTO input ranges. No HTTP/DB; validators remain real."""

import pytest
from pydantic import ValidationError

from app.features.auth.router import (
    FullNameLengthError,
    PasswordLengthError,
    SignUpRequest,
    UpdateNameRequest,
)


@pytest.mark.parametrize("length", [8, 32, 128], ids=["minimum", "middle", "maximum"])
def test_signup_accepts_password_lengths(length):
    request = SignUpRequest(email="user@example.com", password="a" * length, full_name="Parent")
    assert request.password == "a" * length


@pytest.mark.parametrize("length", [0, 7, 129], ids=["empty", "below-minimum", "above-maximum"])
def test_signup_rejects_password_lengths(length):
    with pytest.raises(ValidationError) as raised:
        SignUpRequest(email="user@example.com", password="a" * length, full_name="Parent")
    error = raised.value.errors()[0]
    assert error["loc"] == ("password",)
    assert isinstance(error["ctx"]["error"], PasswordLengthError)


@pytest.mark.parametrize("name", ["A", "보호자", "a" * 100], ids=["minimum", "unicode", "maximum"])
@pytest.mark.parametrize("dto", [SignUpRequest, UpdateNameRequest])
def test_name_accepts_valid_values(dto, name):
    args = {"full_name": name}
    if dto is SignUpRequest:
        args.update(email="user@example.com", password="password")
    assert dto(**args).full_name == name


@pytest.mark.parametrize("name", ["", "   ", "a" * 101], ids=["empty", "blank", "too-long"])
@pytest.mark.parametrize("dto", [SignUpRequest, UpdateNameRequest])
def test_name_rejects_invalid_values(dto, name):
    args = {"full_name": name}
    if dto is SignUpRequest:
        args.update(email="user@example.com", password="password")
    with pytest.raises(ValidationError) as raised:
        dto(**args)
    error = raised.value.errors()[0]
    assert error["loc"] == ("full_name",)
    assert isinstance(error["ctx"]["error"], FullNameLengthError)
