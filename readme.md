# Automated Testing and Quality Assurance Repository

This repository houses automated tests and a quality assurance (QA) application to ensure the quality and reliability of our software. Below, you'll find details on the structure of the repository, configuration files, and instructions on running tests.

## Structure

- **WorkflowConfig:** Contains configuration files for various workflows.
- **.github/workflows/eslint.yml:** Configuration file for the ESLint job, responsible for linting JavaScript files.
- **.github/workflows/build_check_and_execute.yml:** Configuration file for the Build Check and Execution job, responsible for checking and executing build steps.

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

## Build Check and Execution Job Configuration

The Build Check and Execution job is responsible for checking the existence of a build script in the `package.json` file and executing the build steps. Here's a breakdown of its configuration:

```yaml
name: Build Check and Execution

on:
  workflow_call:
    inputs:
      ui5app_path:
        description: 'Path to the UI5 app' # Where the package.json is located
        type: string
        default: './'  # Default value

jobs:
  build_check_and_execute:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2

      - name: Install jq
        run: sudo apt-get update && sudo apt-get install jq -y

      - name: Install Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies from package.json
        run: npm install
        working-directory: ${{ inputs.ui5app_path }}

      - name: Check for Build Step in package.json
        id: build-check-step
        run: |
          build_script=$(jq -r '.scripts.build' package.json)
          if [ -z "$build_script" ]; then
            echo "No build script found in package.json"
            exit 1
          fi
        working-directory: ${{ inputs.ui5app_path }}

      - name: Run Build Step 
        run:  npm run build
        working-directory: ${{ inputs.ui5app_path }}

```

## Using the ESLint Job in Your Repository

To utilize the ESLint job from this repository in your own, you can include the following configuration in your workflow file:

```yaml
name: SRB UI5 QM Workflow
on:
  push:

jobs:
  srb-reuse-linter:
    uses: SRBConsultingTeam/SRB_UI5_QM/.github/workflows/eslint.yml@master
```

This configuration will trigger the ESLint job defined in this repository whenever a push event occurs in your repository. Make sure to adjust the triggers and any other parameters according to your project's requirements.

## Using the Build Job in Your Repository

To utilize the build job from this repository in your own, you can include the following configuration in your workflow file:

```yaml
name: SRB UI5 QM Workflow
on:
  push:

jobs:
  srb-reuse-builder:
    uses: SRBConsultingTeam/SRB_UI5_QM/.github/workflows/build_check_and_execute.yml@master
    with:
      ui5app_path: './'  # Path to your UI5 app directory
```

This configuration will trigger the build job defined in this repository whenever a push event occurs in your repository. You can adjust the `ui5app_path` parameter according to the directory structure of your project.

## Future Additions

We plan to add more predefined GitHub Actions workflows in the future to enhance our automated testing and quality assurance processes.

## Quality Assurance App

Additionally, this repository contains a quality assurance (QA) application, which plays a crucial role in ensuring the overall quality and reliability of our software.

For any further inquiries or assistance, please feel free to reach out to the repository maintainers. Happy coding! 🚀
