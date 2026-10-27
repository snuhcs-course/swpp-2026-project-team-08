# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Create a test account through the actual API and return authenticated headers."""

from httpx import AsyncClient


async def auth_headers(client: AsyncClient, email: str) -> dict[str, str]:
    response = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "supersecret",
            "full_name": "보호자",
        },
    )
    assert response.status_code == 201, response.text
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "supersecret",
        },
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
