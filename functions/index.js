const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

admin.initializeApp();

// GPT-4o mini를 활용한 단어 추출 서버 함수
// API 키는 Firebase Secrets Manager에서 안전하게 관리됩니다.
exports.extractWords = functions.https.onCall(async (data, context) => {
    // API 키 확인 (Firebase Secrets에 저장된 값 사용)
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'OpenAI API Key가 설정되지 않았습니다.');
    }

    const openai = new OpenAI({ apiKey });

    const base64Image = data.image; // 클라이언트에서 보낸 Base64 이미지

    const prompt = `너는 단어장 이미지 전문 스캐너야. 이 이미지에서 영단어와 한국어 뜻을 추출해줘.

규칙:
오타가 있다면 문맥에 맞게 수정해 (예: 'apple'이 'appe'로 보이면 'apple'로 수정).
결과는 반드시 다른 설명 없이 오직 JSON 형식으로만 출력해.
JSON 구조: { "words": [{"word": "단어", "mean": "뜻"}] }
만약 단어와 뜻이 매칭되지 않는 텍스트는 무시해.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: { url: base64Image }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000
        });

        const content = JSON.parse(response.choices[0].message.content);
        return { words: content.words };
    } catch (error) {
        console.error('GPT API Error:', error);
        throw new functions.https.HttpsError('internal', 'AI 분석 중 오류가 발생했습니다.');
    }
});
