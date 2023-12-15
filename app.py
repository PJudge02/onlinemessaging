from flask import Flask, request, jsonify
from cryptography.hazmat.primitives import serialization
import src.backend.Encryption as enc
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, DateTime, Text, BigInteger
from datetime import datetime

# psycopg2

app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["SECRET_KEY"] = "correcthorsebatterystaple"
app.config[
    "SQLALCHEMY_DATABASE_URI"
] = "postgresql://postgres:correcthorsebatterystaple@db.deamjoqkudvhztinzmrv.supabase.co:5432/postgres"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True)
    created_at = Column(DateTime, nullable=False)
    name = Column(Text, nullabe=False)
    email = Column(Text, nullable=False, unique=True)
    private_key = Column(Text)
    public_key = Column(Text)


class Message(db.Model):
    __tablename__ = "messages"
    messageid = Column(BigInteger, primary_key=True)
    useridfrom = Column(BigInteger, nullable=False)
    useridto = Column(BigInteger, nullable=False)
    message = Column(Text, nullable=False)
    encrypted_key = Column(Text)
    nonce = Column(Text)
    signature = Column(Text)
    created_at = Column(DateTime, nullable=False)


@app.post("/api/user/create/keygen/")
def newUser():
    key = enc.rsa_gen_keypair()
    info = request.json
    now = datetime.utcnow().isoformat()
    user = User(
        created_at=now,
        name=info["name"], # type: ignore
        email=info["email"], #type: ignore
        private_key=key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ),
        public_key=key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ),
    ) # type: ignore
    db.session.add(user)
    db.session.commit()
    return "", 200


@app.post("/api/message/<str:sender>/<str:receiver>/encrypt/")
def encrypt_message(sender, receiver):
    return "", 200


@app.post("/api/message/<str:sender>/<str:receiver>/decrypt/")
def decrypt_message(sender, receiver):
    return "", 200
