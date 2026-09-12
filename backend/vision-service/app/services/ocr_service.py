import easyocr

_reader = easyocr.Reader(["id", "en"], gpu=False)


def read_text(frame):
    """
    Membaca teks dari sebuah frame menggunakan EasyOCR.
    """

    result = _reader.readtext(frame)

    return result