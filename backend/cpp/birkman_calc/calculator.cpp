#include "calculator.h"
#include <algorithm>
#include <cmath>

// 가중 평균 응답(1~5)을 0~99로 선형 변환
float BirkmanCalculator::scale_to_99(float avg) {
    float v = (avg - 1.0f) / 4.0f * 99.0f;
    return std::max(0.0f, std::min(99.0f, v));
}

// 캐노니컬 Birkman 사분면 매핑
std::string BirkmanCalculator::color_from_point(float x, float y) {
    if (y >= 0.0f) return (x < 0.0f) ? "red" : "green";
    else           return (x < 0.0f) ? "yellow" : "blue";
}

std::string BirkmanCalculator::secondary_color(float x, float y) {
    if (std::abs(x) >= std::abs(y)) {
        float fy = (y != 0.0f) ? -y : -1.0f;
        return color_from_point(x, fy);
    } else {
        float fx = (x != 0.0f) ? -x : -1.0f;
        return color_from_point(fx, y);
    }
}

BirkmanResult BirkmanCalculator::calculate(
    const std::vector<int>& self_responses,
    const std::vector<int>& others_responses,
    const std::vector<int>& interest_responses,
    const std::vector<QWeights>& self_weights,
    const std::vector<QWeights>& others_weights,
    const std::vector<std::string>& interest_categories,
    const std::vector<std::string>& component_names,
    const std::vector<std::string>& interest_category_names
) {
    BirkmanResult res;

    // 컴포넌트별 가중 합/가중치 합 누적
    std::map<std::string, float> usual_num, usual_den, need_num, need_den;
    for (const auto& c : component_names) {
        usual_num[c] = usual_den[c] = need_num[c] = need_den[c] = 0.0f;
    }

    // Usual (self)
    for (size_t q = 0; q < self_weights.size() && q < self_responses.size(); ++q) {
        int r = self_responses[q];
        for (const auto& [comp, w] : self_weights[q]) {
            if (w > 0.0f) {
                usual_num[comp] += r * w;
                usual_den[comp] += w;
            }
        }
    }
    // Need (others, 음수 가중치는 역채점)
    for (size_t q = 0; q < others_weights.size() && q < others_responses.size(); ++q) {
        int r = others_responses[q];
        for (const auto& [comp, w] : others_weights[q]) {
            if (w > 0.0f) {
                need_num[comp] += r * w;
                need_den[comp] += w;
            } else if (w < 0.0f) {
                float aw = -w;
                need_num[comp] += (6 - r) * aw;
                need_den[comp] += aw;
            }
        }
    }

    for (const auto& c : component_names) {
        float u_avg = usual_den[c] > 0.0f ? usual_num[c] / usual_den[c] : 3.0f;
        float n_avg = need_den[c] > 0.0f ? need_num[c] / need_den[c] : 3.0f;
        float usual = scale_to_99(u_avg);
        float need = scale_to_99(n_avg);
        float gap = need - usual;
        float stress = std::max(0.0f, std::min(99.0f, need + 0.4f * gap));
        res.components[c] = {usual, need, stress};
    }

    // 그리드 좌표 (Usual / Need)
    auto grid = [&](const std::string& key) -> std::pair<float, float> {
        auto val = [&](const std::string& c) {
            const auto& s = res.components[c];
            return (key == "usual") ? s.usual : s.need;
        };
        float people = (val("acceptance") + val("empathy")) / 2.0f;
        float task = (val("structure") + val("advantage")) / 2.0f;
        float direct = (val("authority") + val("activity")) / 2.0f;
        float indirect = (val("structure") + val("freedom")) / 2.0f;
        float x = (people - task) / 99.0f * 50.0f;
        float y = (direct - indirect) / 99.0f * 50.0f;
        return {x, y};
    };

    auto [ux, uy] = grid("usual");
    auto [nx, ny] = grid("need");
    res.life_style_x = ux;
    res.life_style_y = uy;
    res.life_style_need_x = nx;
    res.life_style_need_y = ny;
    res.intensity = std::min(1.0f, std::sqrt(ux * ux + uy * uy) / 50.0f);
    res.primary_color = color_from_point(ux, uy);
    res.secondary_color = secondary_color(ux, uy);

    // 관심 영역
    std::map<std::string, float> totals, counts;
    for (const auto& cat : interest_category_names) { totals[cat] = 0.0f; counts[cat] = 0.0f; }
    for (size_t i = 0; i < interest_categories.size() && i < interest_responses.size(); ++i) {
        const std::string& cat = interest_categories[i];
        totals[cat] += interest_responses[i];
        counts[cat] += 1.0f;
    }
    for (const auto& cat : interest_category_names) {
        float avg = counts[cat] > 0.0f ? totals[cat] / counts[cat] : 3.0f;
        res.interests[cat] = scale_to_99(avg);
    }

    return res;
}
