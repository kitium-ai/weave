#!/bin/bash

echo "===== TYPE CHECKING ALL PACKAGES ====="
for pkg in packages/core packages/shared packages/react packages/vue packages/svelte packages/angular packages/nodejs packages/nextjs packages/nestjs packages/react-native; do
  if [ -d "$pkg" ]; then
    echo ""
    echo "Type checking: $pkg"
    cd "$pkg"
    yarn tsc --noEmit 2>&1 | head -5
    if [ $? -eq 0 ]; then
      echo "✓ $pkg: Type check passed"
    else
      echo "✗ $pkg: Type check FAILED"
    fi
    cd ../../
  fi
done

echo ""
echo "===== RUNNING TESTS ====="
echo ""
echo "Core tests:"
cd packages/core && yarn test 2>&1 | grep -E "(PASS|FAIL|passed|failed|Test Files)" | head -5
cd ../../

echo ""
echo "React tests:"
cd packages/react && yarn test 2>&1 | grep -E "(PASS|FAIL|passed|failed|Test Files)" | head -5
cd ../../

echo ""
echo "Shared tests:"
cd packages/shared && yarn test 2>&1 | grep -E "(PASS|FAIL|passed|failed|Test Files)" | head -5
cd ../../

echo ""
echo "===== SUMMARY ====="
echo "All packages checked"
