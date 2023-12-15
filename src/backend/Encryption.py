from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.serialization import (
    load_pem_public_key,
    load_pem_parameters,
    load_der_private_key,
)  # <- delete this?

import secrets  # Use this for generating random byte strings (keys, etc.)
from time import perf_counter
from inspect import cleandoc  # Cleans up indenting in multi-line strings (""")
from os import urandom

#
# Returns: An rsa.RSAPrivateKey object (which contains both the private key
#   and its corresponding public key; use .public_key() to obtain it).
#
RSA_KEY_BITS = 4096
RSA_PUBLIC_EXPONENT = 65537


def rsa_sign(private_key: rsa.RSAPrivateKey, message: bytes) -> bytes:
    return private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256(),
    )


def rsa_verify(public_key: rsa.RSAPublicKey, message: bytes, signature: bytes):
    public_key.verify(
        signature,
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256(),
    )


# ----
def rsa_gen_keypair():
    return rsa.generate_private_key(
        key_size=RSA_KEY_BITS, public_exponent=RSA_PUBLIC_EXPONENT
    )


#
# Argument: An rsa.RSAPrivateKey object
#
# Returns: An ASCII/UTF-8 string serialization of the private key using the
#   PKCS-8 format and PEM encoding. Does not encrypt the key for at-rest
#   storage.
def rsa_serialize_private_key(private_key: rsa.RSAPrivateKey):
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return pem.decode()


# Argument: A string containing an unencrypted RSA private key in PEM format.
#   Note that this also includes the matching public key (i.e., a PEM
#   "private key" serialization includes both halves of the keypair).
#
# Returns: An rsa.RSAPrivateKey object consisting of the deserialized key.
#
def rsa_deserialize_private_key(pem_privkey: str):
    return serialization.load_pem_private_key(
        pem_privkey.encode(),
        password=None,
    )
    # raise Exception("You need to implement this function!")


#
# Argument: An rsa.RSAPublicKey object
#
# Returns: An ASCII/UTF-8 serialization of the public key using the
#   SubjectPublicKeyInfo format and PEM encoding.
#
def rsa_serialize_public_key(public_key: rsa.RSAPublicKey):
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return pem.decode()


#
# Argument: A string containing an RSA public key in PEM format.
#
# Returns: An rsa.RSAPublicKey object consisting of the deserialized key.
#
def rsa_deserialize_public_key(pem_pubkey: str):
    return serialization.load_pem_public_key(pem_pubkey.encode())


#
# Arguments:
#   public_key: An rsa.RSAPublicKey object containing the public key of the
#       message recipient.
#   plaintext: The plaintext message to be encrypted (as a raw byte string).
#
# Returns: The encrypted message (ciphertext), as a raw byte string.
#
def rsa_encrypt(public_key: rsa.RSAPublicKey, plaintext):
    cipher_text = public_key.encrypt(
        plaintext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return cipher_text


#
# Arguments:
#   private_key: An rsa.RSAPrivateKey object containing the private key of the
#       message recipient.
#   plaintext: The ciphertext message to be decrypted (as a raw byte string).
#
# Returns: The decrypted message (plaintext), as a raw byte string.
#
def rsa_decrypt(private_key: rsa.RSAPrivateKey, ciphertext):
    print(private_key)
    plain_text = private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return plain_text


#
# Encrypts a plaintext message using AES-256 in CTR (Counter) mode.
#
# Arguments:
#   key: A 256-bit (32-byte) secret key. This should either be randomly
#       generated, or derived from a password using a secure key derivation
#       function.
#   nonce: A 128-bit (16-byte) nonce to use with CTR mode. It is imperative
#       that this be randomly generated, and NEVER reused after being used
#       once to encrypt a single message. (This is because each time you
#       encrypt a message with the same nonce in CTR mode, the counter starts
#       fresh from 0 again, meaning the initial blocks will have been XORed
#       with the same keystream as the previous message - allowing the key to
#       be trivially recovered by comparing the two.)
#           (N.B.: Even though we are using AES-256, i.e. a key size of 256
#           bits, the nonce is still 128 bits, because the block size of AES
#           is always 128 bits. A longer key just increases the number of
#           rounds performed.)
#   plaintext: The plaintext message to be encrypted (as a raw byte string).
#
# Returns: The encrypted message (ciphertext), as a raw byte string.
#
def aes_encrypt(key: bytes, nonce: bytes, plaintext: bytes):
    aes256 = algorithms.AES256(key)
    cipher = Cipher(aes256, modes.CTR(nonce))
    encryptor = cipher.encryptor()
    return encryptor.update(plaintext) + encryptor.finalize()


#
# Decrypts a plaintext message using AES-256 in CTR (Counter) mode.
#
# Arguments:
#   key: A 256-bit (32-byte) secret key.
#   nonce: A 128-bit (16-byte) nonce to use with CTR mode.
#   ciphertext: The ciphertext message to be decrypted (as a raw byte string).
#
# No restrictions are placed on the values of key and nonce, but obviously,
# if they don't match the ones used to encrypt the message, the result will
# be gibberish.
#
# Returns: The decrypted message (plaintext), as a raw byte string.
#
def aes_decrypt(key: bytes, nonce: bytes, ciphertext: bytes) -> bytes:
    aes256 = algorithms.AES256(key)
    cipher = Cipher(aes256, modes.CTR(nonce))
    decryptor = cipher.decryptor()
    return decryptor.update(ciphertext) + decryptor.finalize()


#
# Encrypts a plaintext message using AES-256-CTR using a randomly generated
# session key and nonce.
#
# Argument: The plaintext message to be encrypted (as a raw byte string).
#
# Returns: A tuple containing the following elements:
#   session_key: The randomly-generated 256-bit session key used to encrypt
#       the message (as a raw byte string).
#   nonce: The randomly-generated 128-bit nonce used in the encryption (as a
#       raw byte string).
#   ciphertext: The encrypted message (as a raw byte string).
#
def aes_encrypt_with_random_session_key(plaintext: bytes):
    key = urandom(32)
    nonce = urandom(16)
    message = aes_encrypt(key, nonce, plaintext)
    return (key, nonce, message)


#
# Encrypt a message using AES-256-CTR and a random session key, which in turn
# is encrypted with RSA so that it can be decrypted by the given public key.
#
# Arguments:
#   public_key: An rsa.RSAPublicKey object containing the public key of the
#       message recipient.
#   plaintext: The plaintext message to be encrypted (as a raw byte string).
#
# Returns: A tuple containing the following elements:
#   encrypted_session_key: The randomly-generated AES session key, encrypted
#       using RSA with the given public key (as a raw byte string).
#   nonce: The randomly-generated nonce used in the AES-CTR encrpytion (as a
#       raw byte string).
#   ciphertext: The AES-256-CTR-encrypted message (as a raw byte string).
#
def encrypt_message_with_aes_and_rsa(
    public_key: rsa.RSAPublicKey,
    plaintext: bytes,
    sender_private_key: rsa.RSAPrivateKey,
):
    key, nonce, message = aes_encrypt_with_random_session_key(plaintext)
    encrypted_key = rsa_encrypt(public_key, key)
    signature = rsa_sign(sender_private_key, (message + encrypted_key + nonce))
    return (encrypted_key, nonce, message, signature)


#
# Decrypt a message that has been encrypted with AES-256-CTR, using an
# RSA-encrypted session key and an unencrypted nonce.
#
# Arguments:
#   private_key: An rsa.RSAPrivateKey object containing the private key that
#       will be used to decrypt the session key.
#   encrypted_session_key: The RSA-encrypted session key that will be used to
#       decrypt the actual message with AES-256-CTR (as a raw byte string).
#   nonce: The nonce that will be used to decrypt the message with
#       AES-256-CTR (as a raw byte string).
#   ciphertext: The AES-256-CTR-encrypted message (as a raw byte string).
#
# Returns: The decrypted message (plaintext), as a raw byte string.
#
def decrypt_message_with_aes_and_rsa(
    private_key: rsa.RSAPrivateKey,
    encrypted_session_key: bytes,
    nonce: bytes,
    ciphertext: bytes,
    signature: bytes,
    sender_public_key: rsa.RSAPublicKey,
):
    full_signature = ciphertext + encrypted_session_key + nonce
    session_key: bytes = rsa_decrypt(private_key, encrypted_session_key)
    rsa_verify(sender_public_key, full_signature, signature)
    return aes_decrypt(session_key, nonce, ciphertext)
