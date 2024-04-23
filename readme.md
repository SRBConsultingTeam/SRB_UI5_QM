# Automated Testing and Quality Assurance Repository

This repository houses automated tests and a quality assurance (QA) application to ensure the quality and reliability of our software. Below, you'll find details on the structure of the repository, configuration files, and instructions on running tests.

## Structure

- **WorkflowConfig:** Contains configuration files for various workflows.
- **.github/workflows/eslint.yml:** Configuration file for the ESLint job, responsible for linting JavaScript files.

## ESLint Job Configuration

The ESLint job is configured to run on a specific workflow call trigger. Here's a breakdown of its configuration:

```yaml
name: ESLint

on:
  workflow_call:

jobs:
  linter-job:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js v20
        uses: actions/setup-node@v2
        with:
          node-version: "20"

      - name: Download ESLint config file from QM repository
        run: |
          curl -o .eslintrc.js https://raw.githubusercontent.com/SRBConsultingTeam/SRB_UI5_QM/master/WorkflowConfig/.eslintrc.js

      - name: Install ESLint and dependencies
        run: |
          npm install eslint@8.7.0

      - name: Run ESLint
        run: npx eslint . --config .eslintrc.js
```

This job runs on an Ubuntu latest environment and performs the following steps:

1. Checks out the repository.
2. Sets up Node.js version 20.
3. Downloads the ESLint configuration file from the QM repository.
4. Installs ESLint and its dependencies.
5. Runs ESLint with the specified configuration.

## Using the Lint Job in Your Repository

To utilize the linting job from this repository in your own, you can include the following configuration in your workflow file:

```yaml
name: SRB UI5 QM Workflow
on:
  push:

jobs:
  srb-reuse-linter:
    uses: SRBConsultingTeam/SRB_UI5_QM/.github/workflows/eslint.yml@master
```

This configuration will trigger the linting job defined in this repository whenever a push event occurs in your repository. Make sure to adjust the triggers and any other parameters according to your project's requirements.

## Future Additions

We plan to add more predefined GitHub Actions workflows in the future to enhance our automated testing and quality assurance processes.

## Quality Assurance App

Additionally, this repository contains a quality assurance (QA) application, which plays a crucial role in ensuring the overall quality and reliability of our software.

For any further inquiries or assistance, please feel free to reach out to the repository maintainers. Happy coding! 🚀