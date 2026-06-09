#pragma once
#include <vector>
#include <string>
#include <map>

struct ComponentScore {
    float usual;
    float need;
    float stress;
};

struct BirkmanResult {
    std::map<std::string, ComponentScore> components;
    std::string primary_color;
    std::string secondary_color;
    float life_style_x;       // Usual 좌표 X (-50~+50, 업무 ↔ 관계)
    float life_style_y;       // Usual 좌표 Y (-50~+50, 간접 ↔ 직접)
    float life_style_need_x;  // Need 좌표 X
    float life_style_need_y;  // Need 좌표 Y
    float intensity;          // 유형 강도 (0~1)
    std::map<std::string, float> interests;
};

// 한 문항의 컴포넌트별 가중치 (음수 = 역채점)
using QWeights = std::map<std::string, float>;

class BirkmanCalculator {
public:
    // 가중치를 Python(birkman_data.py)에서 인자로 전달받아 계산 → 단일 소스 유지
    BirkmanResult calculate(
        const std::vector<int>& self_responses,
        const std::vector<int>& others_responses,
        const std::vector<int>& interest_responses,
        const std::vector<QWeights>& self_weights,
        const std::vector<QWeights>& others_weights,
        const std::vector<std::string>& interest_categories,
        const std::vector<std::string>& component_names,
        const std::vector<std::string>& interest_category_names
    );

private:
    static float scale_to_99(float weighted_avg_response);
    static std::string color_from_point(float x, float y);
    static std::string secondary_color(float x, float y);
};
