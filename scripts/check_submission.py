import os
import sys

def check_submission():
    files_to_check = ['README.md', 'DEMO.md', 'SUBMISSION.md']
    placeholders = ['[video link]', '[repo link]', 'your-video', '[insert']
    
    failed = False
    
    for filename in files_to_check:
        if not os.path.exists(filename):
            print(f"⚠️ Warning: {filename} does not exist.")
            continue
            
        with open(filename, 'r') as f:
            content = f.read()
            
        for placeholder in placeholders:
            if placeholder in content:
                print(f"❌ Error: Found placeholder '{placeholder}' in {filename}")
                failed = True
                
    if failed:
        print("Submission check failed. Please replace all placeholders before submitting.")
        sys.exit(1)
    else:
        print("✅ Submission check passed! No placeholders found.")
        sys.exit(0)

if __name__ == "__main__":
    check_submission()
