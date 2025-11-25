"""
Performance Benchmarks for Page Load Impact
Tests the performance impact of the Veil extension on page load times
"""

import time
import statistics
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import json


class PerformanceBenchmark:
    """
    Benchmark page load performance with and without extension
    """
    
    def __init__(self, extension_path=None):
        """
        Initialize benchmark
        
        Args:
            extension_path: Path to unpacked extension directory
        """
        self.extension_path = extension_path
        self.results = []
        
    def setup_browser(self, with_extension=True):
        """
        Set up Chrome browser with or without extension
        
        Args:
            with_extension: Whether to load the extension
            
        Returns:
            WebDriver instance
        """
        options = Options()
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--no-sandbox')
        
        if with_extension and self.extension_path:
            options.add_argument(f'--load-extension={self.extension_path}')
        
        driver = webdriver.Chrome(options=options)
        return driver
    
    def measure_page_load(self, driver, url):
        """
        Measure page load time
        
        Args:
            driver: WebDriver instance
            url: URL to load
            
        Returns:
            Load time in seconds
        """
        start_time = time.time()
        driver.get(url)
        
        # Wait for page to fully load
        driver.execute_script('return document.readyState') == 'complete'
        
        end_time = time.time()
        return end_time - start_time
    
    def run_benchmark(self, urls, iterations=5):
        """
        Run benchmark on list of URLs
        
        Args:
            urls: List of URLs to test
            iterations: Number of times to test each URL
            
        Returns:
            Dictionary with benchmark results
        """
        results = {
            'with_extension': {},
            'without_extension': {},
            'overhead': {}
        }
        
        print("Running benchmarks...")
        
        for url in urls:
            print(f"\nTesting: {url}")
            
            # Test without extension
            print("  Without extension...")
            times_without = []
            driver = self.setup_browser(with_extension=False)
            
            try:
                for i in range(iterations):
                    load_time = self.measure_page_load(driver, url)
                    times_without.append(load_time)
                    print(f"    Iteration {i+1}: {load_time:.3f}s")
            finally:
                driver.quit()
            
            # Test with extension
            print("  With extension...")
            times_with = []
            driver = self.setup_browser(with_extension=True)
            
            try:
                for i in range(iterations):
                    load_time = self.measure_page_load(driver, url)
                    times_with.append(load_time)
                    print(f"    Iteration {i+1}: {load_time:.3f}s")
            finally:
                driver.quit()
            
            # Calculate statistics
            avg_without = statistics.mean(times_without)
            avg_with = statistics.mean(times_with)
            overhead = ((avg_with - avg_without) / avg_without) * 100
            
            results['without_extension'][url] = {
                'mean': avg_without,
                'median': statistics.median(times_without),
                'stdev': statistics.stdev(times_without) if len(times_without) > 1 else 0,
                'all_times': times_without
            }
            
            results['with_extension'][url] = {
                'mean': avg_with,
                'median': statistics.median(times_with),
                'stdev': statistics.stdev(times_with) if len(times_with) > 1 else 0,
                'all_times': times_with
            }
            
            results['overhead'][url] = overhead
            
            print(f"  Average without extension: {avg_without:.3f}s")
            print(f"  Average with extension: {avg_with:.3f}s")
            print(f"  Overhead: {overhead:.2f}%")
        
        return results
    
    def save_results(self, results, filename='benchmark_results.json'):
        """
        Save benchmark results to JSON file
        
        Args:
            results: Benchmark results dictionary
            filename: Output filename
        """
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nResults saved to {filename}")
    
    def generate_report(self, results):
        """
        Generate a summary report of benchmark results
        
        Args:
            results: Benchmark results dictionary
            
        Returns:
            Report string
        """
        report = "\n" + "="*60 + "\n"
        report += "PERFORMANCE BENCHMARK REPORT\n"
        report += "="*60 + "\n\n"
        
        for url in results['without_extension'].keys():
            report += f"URL: {url}\n"
            report += f"  Without Extension:\n"
            report += f"    Mean: {results['without_extension'][url]['mean']:.3f}s\n"
            report += f"    Median: {results['without_extension'][url]['median']:.3f}s\n"
            report += f"  With Extension:\n"
            report += f"    Mean: {results['with_extension'][url]['mean']:.3f}s\n"
            report += f"    Median: {results['with_extension'][url]['median']:.3f}s\n"
            report += f"  Performance Overhead: {results['overhead'][url]:.2f}%\n"
            report += "\n"
        
        # Calculate overall statistics
        avg_overhead = statistics.mean(results['overhead'].values())
        report += f"Average Performance Overhead: {avg_overhead:.2f}%\n"
        report += "="*60 + "\n"
        
        return report


def main():
    """
    Run performance benchmarks
    """
    # Test URLs (common websites with tracking)
    test_urls = [
        'https://www.google.com',
        'https://www.youtube.com',
        'https://www.facebook.com',
        'https://www.amazon.com',
        'https://www.wikipedia.org'
    ]
    
    # Path to your extension
    extension_path = '../../02_Extension_App'
    
    benchmark = PerformanceBenchmark(extension_path)
    
    # Run benchmarks
    results = benchmark.run_benchmark(test_urls, iterations=3)
    
    # Save results
    benchmark.save_results(results)
    
    # Generate report
    report = benchmark.generate_report(results)
    print(report)
    
    # Save report
    with open('benchmark_report.txt', 'w') as f:
        f.write(report)


if __name__ == '__main__':
    main()
