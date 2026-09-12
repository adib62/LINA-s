def format_ocr_result(result):

    ocr_results = []

    for _, text, confidence in result:

        if confidence < 0.5:
            continue

        text = text.strip()

        if not text:
            continue

        ocr_results.append({
                "text": text,
                "confidence": round(float(confidence), 3)
        })

    return ocr_results