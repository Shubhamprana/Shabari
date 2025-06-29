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

# Add YARA library (assuming it's precompiled and available)
# In a real implementation, you would need to build YARA for Android
# or include precompiled YARA libraries for different architectures
set(YARA_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/yara/include")
set(YARA_LIB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/yara/lib/${ANDROID_ABI}")

# Include YARA headers
include_directories(${YARA_INCLUDE_DIR})

# Find YARA library
find_library(yara-lib
    NAMES yara libyara
    PATHS ${YARA_LIB_DIR}
    NO_DEFAULT_PATH
)

# Create the native library
add_library(yara-engine SHARED
    yara-engine.cpp
)

# Link libraries
target_link_libraries(yara-engine
    ${log-lib}
    ${android-lib}
    ${yara-lib}
)

# Compiler-specific options
if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(yara-engine PRIVATE
        -Wall
        -Wextra
        -Wpedantic
        -fPIC
        -fvisibility=hidden
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
    HAVE_LIBCRYPTO
    HAVE_OPENSSL_MD5_H
    HAVE_OPENSSL_SHA_H
)

