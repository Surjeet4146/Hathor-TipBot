import sys
from transformers import pipeline

classifier = pipeline('sentiment-analysis')
message = sys.argv[1]
result = classifier(message)[0]
if result['label'] == 'POSITIVE':
    print('POSITIVE')
else:
    print('NEUTRAL_OR_NEGATIVE')