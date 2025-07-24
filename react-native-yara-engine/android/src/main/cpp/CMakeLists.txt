cmake_minimum_required(VERSION 3.18.1)

project("yara-engine")

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add compile flags for optimization and debugging
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
set(CMAKE_CXX_FLAGS_DEBUG "-O0 -g")

# Find required packages
find_library(log-lib log)
find_library(android-lib android)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# Create the native library with our self-contained YARA implementation
add_library(yara-engine SHARED
    yara-engine.cpp
    yara-implementation.cpp
)

# Link libraries (only Android system libraries needed)
target_link_libraries(yara-engine
    ${log-lib}
    ${android-lib}
)

# Compiler-specific options
if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(yara-engine PRIVATE
        -fPIC
        -fvisibility=hidden
        -frtti
        -fexceptions
    )
endif()

# Set target properties
set_target_properties(yara-engine PROPERTIES
    ANDROID_ARM_MODE arm
    ANDROID_STL c++_shared
)

# Add preprocessor definitions
target_compile_definitions(yara-engine PRIVATE
    ANDROID
    YARA_SELF_CONTAINED
)

