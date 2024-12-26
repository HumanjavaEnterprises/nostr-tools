#!/bin/bash

# Update test helper imports in all test files
find __tests__ -name "*.test.ts" -type f -exec sed -i '' 's|from '"'"'../test/helpers/test-utils'"'"'|from '"'"'../helpers/test-utils'"'"'|g' {} +
find __tests__ -name "*.test.ts" -type f -exec sed -i '' 's|from '"'"'../../test/helpers/test-utils'"'"'|from '"'"'../helpers/test-utils'"'"'|g' {} +
find __tests__ -name "*.test.ts" -type f -exec sed -i '' 's|from '"'"'../../test-helpers'"'"'|from '"'"'../helpers/test-helpers'"'"'|g' {} +
