cmake_minimum_required(VERSION 3.15)
project(birkman_calc)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Python REQUIRED COMPONENTS Interpreter Development)
find_package(pybind11 CONFIG REQUIRED)

pybind11_add_module(birkman_calc
    birkman_calc/calculator.cpp
    birkman_calc/bindings.cpp
)

target_include_directories(birkman_calc PRIVATE birkman_calc)

install(TARGETS birkman_calc DESTINATION ${Python_SITEARCH})
