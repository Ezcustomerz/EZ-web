"""Safe error handling: avoid leaking internal details in responses/logs outside dev."""
import os
import logging
from typing import Optional


def is_dev_env() -> bool:
    """True when ENV is 'dev' or 'dev_deploy' (safe to log full errors)."""
    return os.getenv("ENV", "dev").lower() in ("dev", "dev_deploy")


def log_exception_if_dev(logger: logging.Logger, message: str, exc: Optional[BaseException] = None) -> None:
    """Log full exception (with traceback) only when ENV is dev or dev_deploy."""
    if is_dev_env():
        if exc is not None:
            logger.exception("%s: %s", message, exc)
        else:
            logger.exception(message)
