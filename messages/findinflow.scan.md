# warnings.localMetadataOnly

Scans only Flow metadata present in this Salesforce DX project (packageDirectories by default). Flows not retrieved into the project are not included. This command does not query an org or the Tooling API.

# warnings.flowsOutsidePackageDirectories

%s flow file(s) in the project are outside packageDirectories and were not scanned (for example: %s). Retrieve or move flows into a package directory, or pass --flow with a file path to scan a single file.