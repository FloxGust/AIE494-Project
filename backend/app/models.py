import uuid
from sqlalchemy import String, Float, Integer, DateTime, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped


class Base(DeclarativeBase):
    pass


class Classification(Base):
    __tablename__ = "classifications"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename:    Mapped[str]       = mapped_column(String, nullable=False)
    stored_path: Mapped[str]       = mapped_column(String, nullable=False)
    file_size:   Mapped[int]       = mapped_column(Integer)
    label:       Mapped[str]       = mapped_column(String)
    confidence:  Mapped[float]     = mapped_column(Float)
    model:       Mapped[str]       = mapped_column(String)
    infer_ms:    Mapped[float]     = mapped_column(Float)
    top5:        Mapped[list]      = mapped_column(JSON, default=list)
    created_at                     = mapped_column(DateTime(timezone=True), server_default=func.now())
