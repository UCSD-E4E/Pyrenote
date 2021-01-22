import json
import csv

def fileWrapperForJson(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
        text = JsonToCsv(data) 
        print("===================================================")
        print(text)


def JsonToCsv(data, filename):
    #print(data)
    with open(filename.replace(".json", ".csv"), 'w', newline='') as csvfile:
        spamwriter = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        spamwriter.writerow(['filename', 'label', 'start', 'duration',  'created_at', 'last_modified', 'is_marked_for_review', 'assigned_users'])
        for audio in data:
            #print(audio)
            original_filename = audio['original_filename']
            assigned_users = audio['assigned_users']
            created_at = audio['created_at']
            filename = audio['filename']
            is_marked_for_review = audio['is_marked_for_review']
            #last_modified = audio['last_modified']
            segments = audio['segmentations']
            for region in segments:
                print(region)
                print(type(segments))
                label = list(region['annotations'].values())[0]['values']['value']
                print(label)
                last_modified = region['last_modified']
                end = region['end_time']
                start = region['start_time']
                spamwriter.writerow([original_filename, label, start, (end-start),  created_at, last_modified, is_marked_for_review, assigned_users])

def JsonToText(data):
    #print(data)
    text = ""
    text = write_row(text, ['filename', 'label', 'start', 'duration',  'created_at', 'last_modified', 'is_marked_for_review', 'assigned_users'])
    for audio in data:
        #print(audio)
        original_filename = audio['original_filename']
        assigned_users = audio['assigned_users']
        created_at = audio['created_at']
        filename = audio['filename']
        is_marked_for_review = audio['is_marked_for_review']
        #last_modified = audio['last_modified']
        segments = audio['segmentations']
        for region in segments:
            print(region)
            print(type(segments))
            label = list(region['annotations'].values())[0]['values']['value']
            print(label)
            last_modified = region['last_modified']
            end = region['end_time']
            start = region['start_time']
            text = write_row(text, [original_filename, label, start, (end-start),  created_at, last_modified, is_marked_for_review, assigned_users])
    return text

def write_row(text, row):
    print(row)
    for i in range(len(row)):
        text = text + str(row[i])
        if (i == len(row)):
            text = text + "\n"
        else:
            text = text + ","
    return text
