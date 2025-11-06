fn main() {
    // Compile both clob.proto and api.proto with serde derives
    tonic_build::configure()
        .type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]")
        .compile(
            &["clob.proto", "api.proto"],
            &["./proto"],

        )
        .unwrap();
}

// tonic_build::configure()
//         .compile_with_config(
//             prost_build::Config::new().type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]"),
//             &["proto/api.proto"],
//             &["proto"],
//         )?;

// fn main() -> Result<(), Box<dyn std::error::Error>> {
//     tonic_build::configure()
//         .compile_protos(
//             &["../protos/clob.proto"],
//             &["proto", "buf/validate"], // add buf/validate include path
//         )?;
//     Ok(())
// }
