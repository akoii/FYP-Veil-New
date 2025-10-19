"""
Dynamic Rules Generator
Generates blocking rules from AI model predictions and known tracker patterns
"""

import json
import numpy as np
from typing import List, Dict, Set
import re

class DynamicRulesGenerator:
    """
    Generates dynamic blocking rules based on ML model predictions
    and pattern analysis
    """
    
    def __init__(self):
        self.known_trackers = set()
        self.suspicious_patterns = []
        self.whitelist = set()
        
    def load_known_trackers(self, filepath: str):
        """
        Load known tracking domains from file
        
        Args:
            filepath: Path to JSON file with tracker domains
        """
        with open(filepath, 'r') as f:
            data = json.load(f)
            self.known_trackers = set(data.get('domains', []))
    
    def add_suspicious_pattern(self, pattern: str, confidence: float):
        """
        Add a suspicious pattern detected by the ML model
        
        Args:
            pattern: URL pattern or domain
            confidence: Model confidence score (0-1)
        """
        if confidence > 0.75:  # High confidence threshold
            self.suspicious_patterns.append({
                'pattern': pattern,
                'confidence': confidence,
                'type': self._classify_pattern(pattern)
            })
    
    def _classify_pattern(self, pattern: str) -> str:
        """
        Classify the type of tracking pattern
        
        Args:
            pattern: URL pattern or domain
            
        Returns:
            Pattern type (e.g., 'analytics', 'advertising', 'social')
        """
        pattern_lower = pattern.lower()
        
        if any(word in pattern_lower for word in ['analytics', 'ga', 'gtag', 'stats']):
            return 'analytics'
        elif any(word in pattern_lower for word in ['ad', 'doubleclick', 'adsense']):
            return 'advertising'
        elif any(word in pattern_lower for word in ['facebook', 'twitter', 'linkedin', 'social']):
            return 'social'
        elif any(word in pattern_lower for word in ['track', 'pixel', 'beacon']):
            return 'tracking'
        else:
            return 'unknown'
    
    def generate_chrome_rules(self, max_rules: int = 5000) -> List[Dict]:
        """
        Generate Chrome declarativeNetRequest rules
        
        Args:
            max_rules: Maximum number of rules to generate
            
        Returns:
            List of rule objects
        """
        rules = []
        rule_id = 1
        
        # Generate rules for known trackers
        for domain in list(self.known_trackers)[:max_rules // 2]:
            rules.append({
                'id': rule_id,
                'priority': 1,
                'action': {'type': 'block'},
                'condition': {
                    'urlFilter': f'*://{domain}/*',
                    'resourceTypes': [
                        'script',
                        'xmlhttprequest',
                        'image',
                        'sub_frame'
                    ]
                }
            })
            rule_id += 1
        
        # Generate rules for suspicious patterns
        for item in self.suspicious_patterns[:max_rules // 2]:
            pattern = item['pattern']
            pattern_type = item['type']
            
            # Adjust priority based on pattern type
            priority = 2 if pattern_type in ['analytics', 'advertising'] else 3
            
            rules.append({
                'id': rule_id,
                'priority': priority,
                'action': {'type': 'block'},
                'condition': {
                    'urlFilter': self._convert_to_url_filter(pattern),
                    'resourceTypes': [
                        'script',
                        'xmlhttprequest',
                        'image'
                    ]
                }
            })
            rule_id += 1
            
            if rule_id > max_rules:
                break
        
        return rules
    
    def _convert_to_url_filter(self, pattern: str) -> str:
        """
        Convert pattern to Chrome URL filter format
        
        Args:
            pattern: Input pattern
            
        Returns:
            URL filter string
        """
        # Simple conversion - can be enhanced
        if pattern.startswith('http'):
            return pattern
        elif '.' in pattern and '/' not in pattern:
            # Looks like a domain
            return f'*://{pattern}/*'
        else:
            # Treat as substring match
            return f'*{pattern}*'
    
    def generate_firefox_rules(self) -> List[Dict]:
        """
        Generate Firefox webRequest blocking rules
        
        Returns:
            List of rule objects
        """
        patterns = []
        
        # Add known trackers
        for domain in self.known_trackers:
            patterns.append(f'*://{domain}/*')
        
        # Add suspicious patterns
        for item in self.suspicious_patterns:
            patterns.append(self._convert_to_url_filter(item['pattern']))
        
        return {
            'patterns': patterns,
            'types': [
                'script',
                'xmlhttprequest',
                'image',
                'sub_frame'
            ]
        }
    
    def export_rules(self, filepath: str, browser: str = 'chrome'):
        """
        Export rules to JSON file
        
        Args:
            filepath: Output file path
            browser: Target browser ('chrome' or 'firefox')
        """
        if browser == 'chrome':
            rules = self.generate_chrome_rules()
        elif browser == 'firefox':
            rules = self.generate_firefox_rules()
        else:
            raise ValueError(f"Unsupported browser: {browser}")
        
        with open(filepath, 'w') as f:
            json.dump(rules, f, indent=2)
        
        print(f"Exported {len(rules)} rules to {filepath}")
    
    def analyze_domain_similarity(self, domain: str, threshold: float = 0.8) -> bool:
        """
        Check if a domain is similar to known trackers
        
        Args:
            domain: Domain to check
            threshold: Similarity threshold
            
        Returns:
            True if domain is suspicious
        """
        # Simple implementation - can use more sophisticated algorithms
        # like Levenshtein distance or domain embedding similarity
        
        domain_lower = domain.lower()
        
        for tracker in self.known_trackers:
            tracker_lower = tracker.lower()
            
            # Check for substring match
            if tracker_lower in domain_lower or domain_lower in tracker_lower:
                return True
            
            # Check for similar structure (same TLD, similar length)
            if self._calculate_simple_similarity(domain_lower, tracker_lower) > threshold:
                return True
        
        return False
    
    def _calculate_simple_similarity(self, str1: str, str2: str) -> float:
        """
        Calculate simple similarity score between two strings
        
        Args:
            str1: First string
            str2: Second string
            
        Returns:
            Similarity score (0-1)
        """
        # Count common characters
        common = sum(1 for c in set(str1) if c in set(str2))
        total = len(set(str1 + str2))
        
        return common / total if total > 0 else 0


def main():
    """
    Example usage
    """
    generator = DynamicRulesGenerator()
    
    # Add some known trackers
    generator.known_trackers.add('doubleclick.net')
    generator.known_trackers.add('google-analytics.com')
    generator.known_trackers.add('facebook.com')
    
    # Add suspicious patterns (these would come from ML model)
    generator.add_suspicious_pattern('tracker.example.com', 0.95)
    generator.add_suspicious_pattern('ad-server.net', 0.87)
    
    # Generate and export rules
    generator.export_rules('blocking_rules_chrome.json', 'chrome')
    generator.export_rules('blocking_rules_firefox.json', 'firefox')
    
    print("Rules generated successfully!")


if __name__ == '__main__':
    main()
