"""C++ 모듈 빌드 스크립트 (pip install 방식)"""
from pybind11.setup_helpers import Pybind11Extension, build_ext
from setuptools import setup

ext = Pybind11Extension(
    "birkman_calc",
    sources=[
        "birkman_calc/calculator.cpp",
        "birkman_calc/bindings.cpp",
    ],
    include_dirs=["birkman_calc"],
    cxx_std=17,
)

setup(
    name="birkman_calc",
    version="1.0.0",
    ext_modules=[ext],
    cmdclass={"build_ext": build_ext},
)
