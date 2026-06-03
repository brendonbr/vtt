from app.services.character._core import *


def model_values(character_data: dict[str, Any], model, schema) -> dict[str, Any]:
    try:
        validated_data = schema.model_validate(character_data).model_dump(exclude_unset=True)
    except ValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error.errors()) from error
    model_fields = {column.name for column in model.__table__.columns}
    return {field: value for field, value in validated_data.items() if field in model_fields}
