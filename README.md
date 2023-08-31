# Files structure

```
projects
 |- project1
   |-v1
     |- config.yml
     |- group
       |- item1.md
       |- item2.md
```

# Example config.yml

```yaml
menu:
  installation:
    label: Installation
    files:
      - label: Linux
        file: linux.md

      - label: Mac
        file: mac.md

  help:
    label: Help
    files:
      - label: FAQ
        file: faq.md

      - label: How to upgrade
        file: how-to-upgrade.md

      - label: Troubleshooting
        file: troubleshooting.md
```