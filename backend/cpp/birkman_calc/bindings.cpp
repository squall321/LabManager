#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "calculator.h"

namespace py = pybind11;

py::dict result_to_dict(const BirkmanResult& r) {
    py::dict components_dict;
    for (const auto& [name, score] : r.components) {
        py::dict s;
        s["usual"] = score.usual;
        s["need"] = score.need;
        s["stress"] = score.stress;
        components_dict[name.c_str()] = s;
    }

    py::dict interests_dict;
    for (const auto& [name, val] : r.interests) {
        interests_dict[name.c_str()] = val;
    }

    py::dict result;
    result["primary_color"] = r.primary_color;
    result["secondary_color"] = r.secondary_color;
    result["life_style_x"] = r.life_style_x;
    result["life_style_y"] = r.life_style_y;
    result["life_style_need_x"] = r.life_style_need_x;
    result["life_style_need_y"] = r.life_style_need_y;
    result["intensity"] = r.intensity;
    result["components"] = components_dict;
    result["interests"] = interests_dict;
    return result;
}

PYBIND11_MODULE(birkman_calc, m) {
    m.doc() = "Birkman 점수 계산 C++ 모듈 (가중치는 Python에서 주입)";

    m.def("calculate",
        [](const std::vector<int>& self_r,
           const std::vector<int>& others_r,
           const std::vector<int>& interest_r,
           const std::vector<std::map<std::string, float>>& self_w,
           const std::vector<std::map<std::string, float>>& others_w,
           const std::vector<std::string>& interest_cat,
           const std::vector<std::string>& component_names,
           const std::vector<std::string>& interest_cat_names) -> py::dict {
            BirkmanCalculator calc;
            auto result = calc.calculate(
                self_r, others_r, interest_r,
                self_w, others_w, interest_cat,
                component_names, interest_cat_names
            );
            return result_to_dict(result);
        },
        py::arg("self_responses"),
        py::arg("others_responses"),
        py::arg("interest_responses"),
        py::arg("self_weights"),
        py::arg("others_weights"),
        py::arg("interest_categories"),
        py::arg("component_names"),
        py::arg("interest_category_names"),
        "Birkman 응답과 가중치로 점수를 계산합니다"
    );
}
