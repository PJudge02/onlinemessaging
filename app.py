from flask import Flask, request, jsonify
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import src.backend.Encryption as enc
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, DateTime, Text, BigInteger
from datetime import datetime
from flask_cors import CORS

# psycopg2

app = Flask(__name__)
CORS(app)
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
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    private_key = Column(Text)
    public_key = Column(Text)


class Message(db.Model):
    __tablename__ = "messagetracking"
    id = Column(BigInteger, primary_key=True)
    userfrom = Column(BigInteger, nullable=False)
    userto = Column(BigInteger, nullable=False)
    message = Column(Text, nullable=False)
    key = Column(Text)
    nonce = Column(Text)
    signature = Column(Text)
    created_at = Column(DateTime, nullable=False)


@app.post("/api/flask/user/create/keygen/")
def newUser():
    key = enc.rsa_gen_keypair()
    info = request.json
    now = datetime.utcnow().isoformat()
    user = User.query.filter_by(email=info["email"]).all()
    if user:
        return "", 200
    user = User(
        created_at=now,
        name=info["name"],  # type: ignore
        email=info["email"],  # type: ignore
        private_key=enc.rsa_serialize_private_key(key),
        public_key=enc.rsa_serialize_public_key(key.public_key()),
    )  # type: ignore
    db.session.add(user)
    db.session.commit()
    return "", 200


@app.post("/api/flask/message/encrypt/")
def encrypt_message():
    info = request.json
    print(info)
    ## get sender
    sender = User.query.filter_by(email=info["sender"]).first_or_404()
    ## get receiver
    receiver = User.query.filter_by(email=info["receiver"]).first_or_404()

    message: str = info["message"]
    enc_message: bytes = message.encode()

    sender_private: rsa.RSAPrivateKey = enc.rsa_deserialize_private_key(sender.private_key)  # type: ignore
    receiver_public: rsa.RSAPublicKey = enc.rsa_deserialize_public_key(
        receiver.public_key
    ) #type: ignore

    key, nonce, encrypted_message, signature = enc.encrypt_message_with_aes_and_rsa(
        receiver_public, enc_message, sender_private
    )

    message = Message(
        userfrom=sender.email,
        userto=receiver.email,
        message=encrypted_message,
        key=key,
        nonce=nonce,
        signature=signature,
        created_at=datetime.utcnow().isoformat(),
    ) # type: ignore

    db.session.add(message)
    db.session.commit()
    return "", 200


@app.post("/api/flask/message/decrypt/")
def decrypt_message():
    return "", 200
