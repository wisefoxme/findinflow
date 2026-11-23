# summary

Find where a field is read or written in local Flow metadata.

# description

Scans Flow `.flow-meta.xml` files in the current Salesforce DX project (or a subset you choose). Results list each matching flow element and whether the field is read or written.

This command does not connect to an org.

# examples

- Find writes and reads of a custom field on Account:

  <%= config.bin %> <%= command.id %> --name DOB__c --object Account

- Limit to flows whose API name matches a pattern:

  <%= config.bin %> <%= command.id %> --name Status --flow-regexp 'Referral.*'

# flags.name.summary

API name of the field to find (for example `DOB__c` or `PersonBirthdate`).

# flags.object.summary

When set, only report usages in the context of this sObject API name (for example `Account`).

# errors.flowFlagsExclusive

Use either --flow or --flow-regexp, not both.

# warnings.noFlows

No flow files matched the scope filters. Retrieve Flow metadata into packageDirectories (for example force-app/main/default/flows/) or adjust --flow / --flow-regexp.

# info.noMatches

No matching field usages found.

# info.summary

Found %s usage row(s) across %s flow file(s).