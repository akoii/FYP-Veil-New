# Testing Suite

This directory contains all tests for the Veil Privacy Extension project.

## 📁 Structure

```
04_Testing/
├── unit_tests/              # Unit tests for individual components
├── integration_tests/       # Integration tests for system components
└── performance_benchmarks/  # Performance and load time tests
```

## 🧪 Unit Tests

### Overview

Unit tests verify individual components work correctly in isolation.

### Location
`unit_tests/`

### Running Unit Tests

```bash
cd unit_tests

# Run all tests
python -m pytest

# Run specific test file
python -m pytest test_tracker_model.py

# Run with coverage
python -m pytest --cov=. --cov-report=html
```

### Test Files

- `test_tracker_model.py`: Tests for ML model
- `test_rule_generator.py`: Tests for rule generation
- `test_api_handlers.py`: Tests for API wrappers

### Writing Unit Tests

```python
import unittest

class TestMyComponent(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures"""
        pass
    
    def test_feature(self):
        """Test a specific feature"""
        result = my_function()
        self.assertEqual(result, expected_value)
```

## 🔗 Integration Tests

### Overview

Integration tests verify that different components work together correctly.

### Location
`integration_tests/`

### Running Integration Tests

```bash
cd integration_tests
python -m pytest
```

### Test Scenarios

1. **Extension + ML Model**: Test model predictions in extension
2. **Blocklist + Rules**: Test rule generation from blocklists
3. **UI + Backend**: Test frontend-backend communication
4. **Storage + State**: Test data persistence

### Example Test

```python
def test_extension_blocking():
    """Test that extension blocks known trackers"""
    # Load extension
    # Visit tracked site
    # Verify blocking occurred
    # Check privacy score updated
```

## 📊 Performance Benchmarks

### Overview

Performance tests measure the impact of the extension on page load times and resource usage.

### Location
`performance_benchmarks/`

### Running Benchmarks

```bash
cd performance_benchmarks
python page_load_benchmark.py
```

### Metrics Measured

1. **Page Load Time**: With vs. without extension
2. **Memory Usage**: Extension memory footprint
3. **CPU Usage**: Processing overhead
4. **Network Requests**: Number of blocked requests

### Benchmark Results

Results are saved to:
- `benchmark_results.json`: Raw data
- `benchmark_report.txt`: Summary report

### Expected Performance

Target performance goals:
- Page load overhead: < 10%
- Memory usage: < 50MB
- CPU usage: < 5% idle
- Request blocking: > 90% of trackers

## 🎯 Test Coverage

### Coverage Goals

- Unit tests: > 80% code coverage
- Integration tests: All critical paths
- Performance: All major use cases

### Checking Coverage

```bash
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

## 🔄 Continuous Integration

### CI/CD Pipeline

Recommended CI setup:
1. Run unit tests on every commit
2. Run integration tests on pull requests
3. Run performance tests nightly
4. Generate coverage reports

### Example GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest
```

## 📝 Test Data

### Mock Data

Create mock data for testing:
- Sample web requests
- Known tracker lists
- Test URLs
- Expected results

### Test Fixtures

```python
@pytest.fixture
def sample_request():
    return {
        'url': 'https://doubleclick.net/track',
        'domain': 'doubleclick.net',
        'type': 'script',
        'is_tracker': True
    }
```

## 🐛 Debugging Tests

### Tips

1. **Use verbose mode**: `pytest -v`
2. **Run single test**: `pytest test_file.py::test_name`
3. **Print debugging**: `pytest -s` (shows print statements)
4. **Debug on failure**: `pytest --pdb` (drops into debugger)

### Common Issues

- **Import errors**: Check PYTHONPATH
- **Missing dependencies**: Run `pip install -r requirements.txt`
- **Timeout errors**: Increase timeout values
- **Flaky tests**: Add retry logic or fix race conditions

## 📈 Performance Monitoring

### Continuous Monitoring

Set up monitoring for:
- Extension load time
- Memory leaks
- CPU spikes
- Storage growth

### Tools

- Chrome DevTools Performance tab
- Memory profiler
- Network inspector
- Extension metrics API

## 🔒 Security Testing

### Security Checks

1. **Permission audit**: Verify minimal permissions
2. **Data privacy**: Ensure no data leaks
3. **XSS protection**: Test against injection
4. **CSP compliance**: Content Security Policy

## 📊 Test Reports

### Generating Reports

```bash
# HTML report
pytest --html=report.html

# JUnit XML (for CI)
pytest --junitxml=results.xml

# Coverage report
pytest --cov=. --cov-report=html
```

## 🎯 Best Practices

### Writing Tests

1. **Keep tests independent**: No shared state
2. **Use descriptive names**: `test_blocks_tracking_cookie`
3. **Test one thing**: Single assertion per test
4. **Use fixtures**: Reusable setup code
5. **Mock external dependencies**: Don't rely on network

### Test Organization

```python
class TestTrackerDetection:
    """Tests for tracker detection"""
    
    def test_detects_known_tracker(self):
        """Should identify known tracking domain"""
        pass
    
    def test_allows_legitimate_request(self):
        """Should not block legitimate requests"""
        pass
```

## 📚 Resources

- [pytest Documentation](https://docs.pytest.org/)
- [unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)

## 🤝 Contributing Tests

When adding new features:
1. Write tests first (TDD)
2. Ensure tests pass
3. Maintain coverage
4. Update documentation

---

For more information, see the main project README.md
