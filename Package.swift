// swift-tools-version: 6.1
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "AXKit",
    platforms: [
        .macOS(.v10_15)
    ],
    products: [
        .library(
            name: "AXKit",
            targets: ["AXKit"]
        ),
        .library(
            name: "Module",
            type: .dynamic,
            targets: ["AXKit"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/kabiroberai/node-swift.git", branch: "main")
    ],
    targets: [
        .target(
            name: "AXKit",
            dependencies: [
                .product(name: "NodeAPI", package: "node-swift"),
                .product(name: "NodeModuleSupport", package: "node-swift"),
            ],
            linkerSettings: [
                .unsafeFlags(
                    [
                        "-Xlinker", "-undefined",
                        "-Xlinker", "dynamic_lookup",
                    ],
                    .when(platforms: [.macOS])
                )
            ]
        ),
        .testTarget(
            name: "AXKitTests",
            dependencies: ["AXKit"]
        ),
    ]
)
