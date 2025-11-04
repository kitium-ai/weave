plugins {
  id("java")
  id("org.jetbrains.kotlin.jvm") version "1.9.20"
  id("org.jetbrains.intellij") version "1.16.0"
}

group = "com.kitiumai"
version = "1.0.0"

repositories {
  mavenCentral()
}

dependencies {
  // Kotlin Standard Library
  implementation(kotlin("stdlib"))

  // HTTP Client for API calls
  implementation("com.squareup.okhttp3:okhttp:4.11.0")
  implementation("com.google.code.gson:gson:2.10.1")

  // Logging
  implementation("org.slf4j:slf4j-api:2.0.9")

  // Testing
  testImplementation("junit:junit:4.13.2")
  testImplementation("org.mockito:mockito-core:5.5.0")
}

// IntelliJ Plugin Configuration
intellij {
  version.set("2023.1")
  type.set("WS")  // WebStorm

  plugins.set(listOf(
    "com.jetbrains.javascript"
  ))
}

tasks {
  withType<JavaCompile> {
    sourceCompatibility = "17"
    targetCompatibility = "17"
  }

  withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions.jvmTarget = "17"
  }

  patchPluginXml {
    sinceBuild.set("231.0")
    untilBuild.set("241.*")
  }

  signPlugin {
    certificateChain.set(System.getenv("CERTIFICATE_CHAIN"))
    privateKey.set(System.getenv("PRIVATE_KEY"))
    password.set(System.getenv("PRIVATE_KEY_PASSWORD"))
  }

  publishPlugin {
    token.set(System.getenv("PUBLISH_TOKEN"))
  }
}

// Build with all optimizations
tasks.build {
  dependsOn("buildPlugin")
}
