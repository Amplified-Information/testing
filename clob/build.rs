fn main() {
    // tonic_build::compile_protos("../protos/clob.proto")
    //     .unwrap();

    // tonic_build::compile_protos(
    //         &["../protos/clob.proto"],
    //         &["buf/validate"], // add buf/validate include path
    //     ).unwrap();

    tonic_build::configure()
    .compile(
        &["clob.proto"],
        &["./proto" /* , "./proto/buf/validate" */],
    )
    .unwrap();
}


// fn main() -> Result<(), Box<dyn std::error::Error>> {
//     tonic_build::configure()
//         .compile_protos(
//             &["../protos/clob.proto"],
//             &["proto", "buf/validate"], // add buf/validate include path
//         )?;
//     Ok(())
// }
