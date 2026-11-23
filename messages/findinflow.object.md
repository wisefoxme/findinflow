# summary

Find where an sObject is referenced in local Flow metadata.

# description

Scans Flow `.flow-meta.xml` files in the current Salesforce DX project (or a subset you choose). Reports record-triggered objects, DML elements, and SObject variables.

This command does not connect to an org.

# examples

- Find ActionPlan references:

  <%= config.bin %> <%= command.id %> --name ActionPlan

- Single flow file:

  <%= config.bin %> <%= command.id %> --name Account --flow Submit_to_Maximus

# flags.name.summary

API name of the sObject to find (for example `Account` or `Referral_Stage_History__c`).

# errors.flowFlagsExclusive

Use either --flow or --flow-regexp, not both.

# warnings.noFlows

No flow files matched the scope filters. Retrieve Flow metadata into packageDirectories (for example force-app/main/default/flows/) or adjust --flow / --flow-regexp.

# info.noMatches

No matching object references found.

# info.summary

Found %s reference row(s) across %s flow file(s).