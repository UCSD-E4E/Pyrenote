import sqlalchemy as sa
from sqlalchemy import or_, not_
from sqlalchemy.sql.expression import true, false
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm.attributes import flag_modified
from backend import app, db
from backend.models import Project, User, Label, Data, Segmentation
from backend.models import LabelType
from . import api
from .helper_functions import (
    check_admin,
    check_admin_permissions,
    general_error,
    missing_data
)
import numpy as np
##
## Calculates IOU scores for review and quality control
## Code mostly taken from  https://github.com/UCSD-E4E/PyHa
## Pyha is a great tool for passive acoustic monitoring with features that
## Allows reserachers to study and identify aduio events in their data
## Give it a look!
##





@api.route("/update_confidence/<int:project_id>/<int:data_id>", methods=["PUT"])
@jwt_required
def update_confidence(project_id, data_id):
    identity = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project.is_iou:
        return jsonify(message="iou meterics not used"), 202
    data_pt = Data.query.get(data_id)
    request_user = User.query.filter_by(username=identity["username"]
                                        ).first()
   
    segmentations_new = Segmentation.query.filter_by(data_id=data_id, counted=0).distinct()
    segmentations_old =  Segmentation.query.filter_by(data_id=data_id, counted=1).distinct()

    if(True):#len(data.users_reviewed) > 0):
        old_df = make_dataframe(data_id, segmentations_old)
        new_df = make_dataframe(data_id, segmentations_new) 
        thing = clip_statistics(new_df, old_df)
    
    for segment in segmentations_new:
        segment.set_counted(1)
        db.session.add(segment)  
        db.session.commit()

    app.logger.info(thing)
    confidence = float(thing.iloc[0]['PRECISION'])
    data_pt.set_previous_users(identity["username"])
    data_pt.set_confidence(confidence)
    flag_modified(data_pt, "users_reviewed") 
    db.session.add(data_pt)  
    db.session.commit()
    app.logger.info("sent!")
    return 200



def make_dataframe(data_id, segmentations):
    data_pt = Data.query.get(data_id)
    
    sample_rate = data_pt.sampling_rate
    clip_length = data_pt.clip_length
    filename = data_pt.original_filename
    folder = "./test/"
    
    FOLDER = []
    FILE = []
    CHANNEL = []
    CLIP_LENGTH = []
    OFFSET = []
    DURATION = []
    MANUAL_ID = []
    SAMPLE_RATE = []
    data = {'col_1': [3, 2, 1, 0], 'col_2': ['a', 'b', 'c', 'd']}
    for segment in segmentations:
        start = segment.start_time
        duration = segment.end_time - start
        for labelCate in segment.values:
            #for values in labelCate["values"]:
                    #TODO DEBUIG THIS ISSUE WITH VALUES AND LABELS
                    manual_id = "bird"
                    #for label in values:
                    #manual_id = label['value']
                    FOLDER.append(folder)
                    FILE.append(filename)
                    CHANNEL.append(0)
                    CLIP_LENGTH.append(clip_length)
                    OFFSET.append(start)
                    SAMPLE_RATE.append(sample_rate)
                    DURATION.append(duration)
                    MANUAL_ID.append(manual_id)
    df = {"FOLDER":tuple(FOLDER), "IN FILE": tuple(FILE), "CHANNEL":  tuple(CHANNEL), "CLIP LENGTH":  tuple(CLIP_LENGTH), "SAMPLE RATE": tuple(SAMPLE_RATE), "OFFSET":  tuple(OFFSET), "DURATION": tuple(DURATION), "MANUAL ID":  tuple(MANUAL_ID)}
    return pd.DataFrame.from_dict(df)










##
## Start of IOU Scores
##

import pandas as pd
from scipy import stats
import numpy as np


# Function that takes in a pandas dataframe of annotations and outputs a
# dataframe of the mean, median, mode, quartiles, and standard deviation of
# the annotation durations.
def annotation_duration_statistics(df):
    """
    Function that calculates basic statistics related to the duration of
    annotations of a Pandas Dataframe compatible with PyHa.
    Args:
        df (Pandas Dataframe)
            - Automated labels or manual labels.
    Returns:
        Pandas Dataframe containing count, mean, mode, standard deviation, and
        IQR values based on annotation duration.
    """
    # Reading in the Duration column of the passed in dataframe as a Python
    # list
    annotation_lengths = df["DURATION"].to_list()
    # converting to numpy array which has more readily available statistics
    # functions
    annotation_lengths = np.asarray(annotation_lengths)
    # Converting the Python list to a numpy array
    entry = {'COUNT': np.shape(annotation_lengths)[0],
             'MODE': stats.mode(np.round(annotation_lengths, 2))[0][0],
             'MEAN': np.mean(annotation_lengths),
             'STANDARD DEVIATION': np.std(annotation_lengths),
             'MIN': np.amin(annotation_lengths),
             'Q1': np.percentile(annotation_lengths, 25),
             'MEDIAN': np.median(annotation_lengths),
             'Q3': np.percentile(annotation_lengths, 75),
             'MAX': np.amax(annotation_lengths)}
    # returning the dictionary as a pandas dataframe
    return pd.DataFrame.from_dict([entry])


def clip_general(automated_df, human_df):
    """
    Function to generate a dataframe with statistics relating to the efficiency
    of the automated label compared to the human label.
    These statistics include true positive, false positive, false negative,
    true negative, union, precision, recall, F1, and Global IoU. For general
    clip overlap
    Args:
        automated_df (Dataframe)
            - Dataframe of automated labels for one clip
        human_df (Dataframe)
            - Dataframe of human labels for one clip.
    Returns:
        Dataframe with general clip overlap statistics comparing the automated
        and human labeling.
    """
    # This looks at one class across one clip
    clip_class = human_df["MANUAL ID"]
    clip_class = list(dict.fromkeys(clip_class))[0]
    duration = automated_df["CLIP LENGTH"].to_list()[0]
    SAMPLE_RATE = automated_df["SAMPLE RATE"].to_list()[0]
    # Initializing two arrays that will represent the human labels and
    # automated labels with respect to the audio clip
    # print(SIGNAL.shape)
    human_arr = np.zeros((int(SAMPLE_RATE * duration),))
    bot_arr = np.zeros((int(SAMPLE_RATE * duration),))

    folder_name = automated_df["FOLDER"].to_list()[0]
    clip_name = automated_df["IN FILE"].to_list()[0]
    # Placing 1s wherever the au
    for row in automated_df.index:
        minval = int(round(automated_df["OFFSET"][row] * SAMPLE_RATE, 0))
        maxval = int(
            round(
                (automated_df["OFFSET"][row] +
                 automated_df["DURATION"][row]) *
                SAMPLE_RATE,
                0))
        bot_arr[minval:maxval] = 1
    for row in human_df.index:
        minval = int(round(human_df["OFFSET"][row] * SAMPLE_RATE, 0))
        maxval = int(
            round(
                (human_df["OFFSET"][row] +
                 human_df["DURATION"][row]) *
                SAMPLE_RATE,
                0))
        human_arr[minval:maxval] = 1

    human_arr_flipped = 1 - human_arr
    bot_arr_flipped = 1 - bot_arr

    true_positive_arr = human_arr * bot_arr
    false_negative_arr = human_arr * bot_arr_flipped
    false_positive_arr = human_arr_flipped * bot_arr
    true_negative_arr = human_arr_flipped * bot_arr_flipped
    IoU_arr = human_arr + bot_arr
    IoU_arr[IoU_arr == 2] = 1

    true_positive_count = np.count_nonzero(
        true_positive_arr == 1) / SAMPLE_RATE
    false_negative_count = np.count_nonzero(
        false_negative_arr == 1) / SAMPLE_RATE
    false_positive_count = np.count_nonzero(
        false_positive_arr == 1) / SAMPLE_RATE
    true_negative_count = np.count_nonzero(
        true_negative_arr == 1) / SAMPLE_RATE
    union_count = np.count_nonzero(IoU_arr == 1) / SAMPLE_RATE

    # Calculating useful values related to tp,fn,fp,tn values

    # Precision = TP/(TP+FP)
    try:
        precision = true_positive_count / \
            (true_positive_count + false_positive_count)

    # Recall = TP/(TP+FN)
        recall = true_positive_count / \
            (true_positive_count + false_negative_count)

    # F1 = 2*(Recall*Precision)/(Recall + Precision)

        f1 = 2 * (recall * precision) / (recall + precision)
        IoU = true_positive_count / union_count
    except BaseException:
        print('''Error calculating statistics, likely due
        to zero division, setting values to zero''')
        f1 = 0
        precision = 0
        recall = 0
        IoU = 0

    # Creating a Dictionary which will be turned into a Pandas Dataframe
    entry = {'FOLDER': folder_name,
             'IN FILE': clip_name,
             'MANUAL ID': clip_class,
             'TRUE POSITIVE': true_positive_count,
             'FALSE POSITIVE': false_positive_count,
             'FALSE NEGATIVE': false_negative_count,
             'TRUE NEGATIVE': true_negative_count,
             'UNION': union_count,
             'PRECISION': precision,
             'RECALL': recall,
             "F1": f1,
             'Global IoU': IoU}

    return pd.DataFrame(entry, index=[0])


# Will have to adjust the isolate function so that it adds a sampling rate
# onto the dataframes.
def automated_labeling_statistics(
        automated_df,
        manual_df,
        stats_type="IoU",
        threshold=0.5):
    """
    Function that will allow users to easily pass in two dataframes of manual
    labels and automated labels, and a dataframe is returned with statistics
    examining the efficiency of the automated labelling system compared to the
    human labels for multiple clips.
    Calls bird_local_scores on corresponding audio clips to generate the
    efficiency statistics for one specific clip which is then all put into one
    dataframe of statistics for multiple audio clips.
    Args:
        automated_df (Dataframe)
            - Dataframe of automated labels of multiple clips.
        manual_df (Dataframe)
            - Dataframe of human labels of multiple clips.
        stats_type (String)
            - String that determines which type of statistics are of interest
        threshold (Float)
            - Defines a threshold for certain types of statistics such as
    Returns:
        Dataframe of statistics comparing automated labels and human labels for
        multiple clips.
    """
    # Getting a list of clips
    clips = automated_df["IN FILE"].to_list()
    # Removing duplicates
    clips = list(dict.fromkeys(clips))
    # Initializing the returned dataframe
    statistics_df = pd.DataFrame()
    # Looping through each audio clip
    for clip in clips:
        clip_automated_df = automated_df[automated_df["IN FILE"] == clip]
        clip_manual_df = manual_df[manual_df["IN FILE"] == clip]
        try:
            if stats_type == "general":
                clip_stats_df = clip_general(
                    clip_automated_df, clip_manual_df)
                if statistics_df.empty:
                    statistics_df = clip_stats_df
                else:
                    statistics_df = statistics_df.append(clip_stats_df)
            elif stats_type == "IoU":
                IoU_Matrix = clip_IoU(clip_automated_df, clip_manual_df)
                clip_stats_df = matrix_IoU_Scores(
                    IoU_Matrix, clip_manual_df, threshold)
                if statistics_df.empty:
                    statistics_df = clip_stats_df
                else:
                    statistics_df = statistics_df.append(clip_stats_df)

        except BaseException:
            app.logger.error("Something went wrong with: " + clip)
            continue
    statistics_df.reset_index(inplace=True, drop=True)
    return statistics_df


def global_dataset_statistics(statistics_df, manual_id = "bird"):
    """
    Function that takes in a dataframe of efficiency statistics for multiple
    clips and outputs their global values.
    Args:
        statistics_df (Dataframe)
            - Dataframe of statistics value for multiple audio clips as
              returned by the function automated_labelling_statistics.
        manual_id (String)
            - String to control the "MANUAL ID" column of the csv file
            format that is used in PyHa. Defaulted to "bird" since the
            package started out with binary bird classification.
    Returns:
        Dataframe of global statistics for the multiple audio clips' labelling.
    """
    tp_sum = statistics_df["TRUE POSITIVE"].sum()
    fp_sum = statistics_df["FALSE POSITIVE"].sum()
    fn_sum = statistics_df["FALSE NEGATIVE"].sum()
    tn_sum = statistics_df["TRUE NEGATIVE"].sum()
    union_sum = statistics_df["UNION"].sum()
    precision = tp_sum / (tp_sum + fp_sum)
    recall = tp_sum / (tp_sum + fn_sum)
    f1 = 2 * (precision * recall) / (precision + recall)
    IoU = tp_sum / union_sum
    entry = {'MANUAL ID': manual_id,
             'PRECISION': round(precision, 6),
             'RECALL': round(recall, 6),
             'F1': round(f1, 6),
             'Global IoU': round(IoU, 6)}
    return pd.DataFrame.from_dict([entry])

# TODO rework this function to implement some linear algebra, right now the
# nested for loop won't handle larger loads well To make a global matrix, find
# the clip with the most amount of automated labels and set that to the number
# of columns I believe this is currently the largest bottleneck in terms of
# temporal performance.


def clip_IoU(automated_df, manual_df):
    """
    Function that takes in the manual and automated labels for a clip and
    outputs IoU metrics of each human label with respect to each
    automated label.
    Args:
        automated_df (Dataframe)
            - Dataframe of automated labels for an audio clip.
        manual_df (Dataframe)
             - Dataframe of human labels for an audio clip.
    Returns:
        IoU_Matrix (arr)
            - (human label count) x (automated label count) matrix where each
              row contains the IoU of each automated annotation with respect to
              a human label.
    """

    automated_df.reset_index(inplace=True, drop=True)
    manual_df.reset_index(inplace=True, drop=True)
    # Determining the number of rows in the output numpy array
    manual_row_count = manual_df.shape[0]
    # Determining the number of columns in the output numpy array
    automated_row_count = automated_df.shape[0]

    # Determining the length of the input clip
    duration = automated_df["CLIP LENGTH"].to_list()[0]
    # Determining the sample rate of the input clip
    SAMPLE_RATE = automated_df["SAMPLE RATE"].to_list()[0]

    # Initializing the output array that will contain the clip-by-clip
    # Intersection over Union percentages.
    IoU_Matrix = np.zeros((manual_row_count, automated_row_count))
    # print(IoU_Matrix.shape)

    # Initializing arrays that will represent each of the human and automated
    # labels
    bot_arr = np.zeros((int(duration * SAMPLE_RATE)))
    human_arr = np.zeros((int(duration * SAMPLE_RATE)))

    # Looping through each human label
    for row in manual_df.index:
        # print(row)
        # Determining the beginning of a human label
        minval = int(round(manual_df["OFFSET"][row] * SAMPLE_RATE, 0))
        # Determining the end of a human label
        maxval = int(
            round(
                (manual_df["OFFSET"][row] +
                 manual_df["DURATION"][row]) *
                SAMPLE_RATE,
                0))
        # Placing the label relative to the clip
        human_arr[minval:maxval] = 1
        # Looping through each automated label
        for column in automated_df.index:
            # Determining the beginning of an automated label
            minval = int(
                round(
                    automated_df["OFFSET"][column] *
                    SAMPLE_RATE,
                    0))
            # Determining the ending of an automated label
            maxval = int(
                round(
                    (automated_df["OFFSET"][column] +
                     automated_df["DURATION"][column]) *
                    SAMPLE_RATE,
                    0))
            # Placing the label relative to the clip
            bot_arr[minval:maxval] = 1
            # Determining the overlap between the human label and the automated
            # label
            intersection = human_arr * bot_arr
            # Determining the union between the human label and the automated
            # label
            union = human_arr + bot_arr
            union[union == 2] = 1
            # Determining how much of the human label and the automated label
            # overlap with respect to time
            intersection_count = np.count_nonzero(
                intersection == 1) / SAMPLE_RATE
            # Determining the span of the human label and the automated label
            # with respect to time.
            union_count = np.count_nonzero(union == 1) / SAMPLE_RATE
            # Placing the Intersection over Union Percentage into it's
            # respective position in the array.
            IoU_Matrix[row, column] = round(
                intersection_count / union_count, 4)
            # Resetting the automated label to zero
            bot_arr[bot_arr == 1] = 0
        # Resetting the human label to zero
        human_arr[human_arr == 1] = 0

    return IoU_Matrix


def matrix_IoU_Scores(IoU_Matrix, manual_df, threshold):
    """
    Function that takes in the IoU Matrix from the clip_IoU function and ouputs
    the number of true positives and false positives, as well as calculating
    the precision, recall, and f1 metrics.
    Args:
        IoU_Matrix (arr)
            - (human label count) x (automated label count) matrix where each
               row contains the IoU of each automated annotation with respect
               to a human label.
        manual_df (Dataframe)
            - Dataframe of human labels for an audio clip.
        threshold (float)
            - IoU threshold for determining true positives, false
                            positives, and false negatives.
    Returns:
        Dataframe of clip statistics such as True Positive, False Negative,
        False Positive, Precision, Recall, and F1 values for an audio clip.
    """
    clip_class = manual_df["MANUAL ID"][0]
    audio_dir = manual_df["FOLDER"][0]
    filename = manual_df["IN FILE"][0]
    # TODO make sure that all of these calculations are correct. It is
    # confusing to me that the Precision and Recall scores have a positive
    # correlation. Determining which automated label has the highest IoU across
    # each human label
    automated_label_best_fits = np.max(IoU_Matrix, axis=1)
    # human_label_count = automated_label_best_fits.shape[0]
    # Calculating the number of true positives based off of the passed in
    # thresholds.
    tp_count = automated_label_best_fits[automated_label_best_fits >=
                                         threshold].shape[0]
    # Calculating the number of false negatives from the number of human
    # labels and true positives
    fn_count = automated_label_best_fits[automated_label_best_fits <
                                         threshold].shape[0]

    # Calculating the false positives
    max_val_per_column = np.max(IoU_Matrix, axis=0)
    fp_count = max_val_per_column[max_val_per_column < threshold].shape[0]

    # Calculating the necessary statistics
    try:
        recall = round(tp_count / (tp_count + fn_count), 4)
        precision = round(tp_count / (tp_count + fp_count), 4)
        f1 = round(2 * (recall * precision) / (recall + precision), 4)
    except ZeroDivisionError:
        print(
            "Division by zero setting precision, recall, and f1 to zero on " +
            filename)
        recall = 0
        precision = 0
        f1 = 0

    entry = {'FOLDER': audio_dir,
             'IN FILE': filename,
             'MANUAL ID': clip_class,
             'TRUE POSITIVE': tp_count,
             'FALSE NEGATIVE': fn_count,
             'FALSE POSITIVE': fp_count,
             'PRECISION': precision,
             'RECALL': recall,
             'F1': f1}

    return pd.DataFrame.from_dict([entry])


def clip_catch(automated_df, manual_df):
    """
    Function that determines whether or not a human label has been found across
    all of the automated labels.
    Args:
        automated_df (Dataframe)
            - Dataframe of automated labels for an audio clip.
        manual_df (Dataframe)
            - Dataframe of human labels for an audio clip.
    Returns:
        Numpy Array of statistics regarding the amount of overlap between the
        manual and automated labels relative to the number of samples.
    """
    # resetting the indices to make this function work
    automated_df.reset_index(inplace=True, drop=True)
    manual_df.reset_index(inplace=True, drop=True)
    # figuring out how many automated labels and human labels exist
    manual_row_count = manual_df.shape[0]
    automated_row_count = automated_df.shape[0]
    # finding the length of the clip as well as the sampling frequency.
    duration = automated_df["CLIP LENGTH"].to_list()[0]
    SAMPLE_RATE = automated_df["SAMPLE RATE"].to_list()[0]
    # initializing the output array, as well as the two arrays used to
    # calculate catch scores
    catch_matrix = np.zeros(manual_row_count)
    bot_arr = np.zeros((int(duration * SAMPLE_RATE)))
    human_arr = np.zeros((int(duration * SAMPLE_RATE)))

    # Determining the automated labelled regions with respect to samples
    # Looping through each human label
    for row in automated_df.index:
        # converting each label into a "pulse" on an array that represents the
        # labels as 0's and 1's on bot array.
        minval = int(round(automated_df["OFFSET"][row] * SAMPLE_RATE, 0))
        maxval = int(
            round(
                (automated_df["OFFSET"][row] +
                 automated_df["DURATION"][row]) *
                SAMPLE_RATE,
                0))
        bot_arr[minval:maxval] = 1

    # Looping through each human label and computing catch =
    # (#intersections)/(#samples in label)
    for row in manual_df.index:
        # Determining the beginning of a human label
        minval = int(round(manual_df["OFFSET"][row] * SAMPLE_RATE, 0))
        # Determining the end of a human label
        maxval = int(
            round(
                (manual_df["OFFSET"][row] +
                 manual_df["DURATION"][row]) *
                SAMPLE_RATE,
                0))
        # Placing the label relative to the clip
        human_arr[minval:maxval] = 1
        # Determining the length of a label with respect to samples
        samples_in_label = maxval - minval
        # Finding where the human label and all of the annotated labels overlap
        intersection = human_arr * bot_arr
        # Determining how many samples overlap.
        intersection_count = np.count_nonzero(intersection == 1)
        # Intersection/length of label
        catch_matrix[row] = round(intersection_count / samples_in_label, 4)
        # resetting the human label
        human_arr[human_arr == 1] = 0

    return catch_matrix


# def dataset_IoU(automated_df,manual_df):
#    """
#    Function that takes in two Pandas dataframes that represent human labels
#    and automated labels.
#    It then runs the clip_IoU function across each clip and appends the best
#    fit IoU score to each labels on the manual dataframe as its output.
#
#    Args:
#        automated_df (Dataframe) - Dataframe of automated labels for multiple
#                                   audio clips.
#        manual_df (Dataframe) - Dataframe of human labels for multiple audio
#                                clips.
#
#    Returns:
#        Dataframe of manual labels with the best fit IoU score as a column.
#    """
#    # Getting a list of clips
#    clips = automated_df["IN FILE"].to_list()
#    # Removing duplicates
#    clips = list(dict.fromkeys(clips))
#    # Initializing the ouput dataframe
#    manual_df_with_IoU = pd.DataFrame()
#    for clip in clips:
#        print(clip)
#        # Isolating a clip from the human and automated dataframes
#        clip_automated_df = automated_df[automated_df["IN FILE"] == clip]
#        clip_manual_df = manual_df[manual_df["IN FILE"] == clip]
#        # Calculating the IoU scores of each human label.
#        IoU_Matrix = clip_IoU(clip_automated_df,clip_manual_df)
#        # Finding the best automated IoU score with respect to each label
#        automated_label_best_fits = np.max(IoU_Matrix,axis=1)
#        clip_manual_df["IoU"] = automated_label_best_fits
#        # Appending on the best fit IoU score to each human label
#        if manual_df_with_IoU.empty == True:
#            manual_df_with_IoU = clip_manual_df
#        else:
#            manual_df_with_IoU = manual_df_with_IoU.append(clip_manual_df)
#    # Adjusting the indices.
#    manual_df_with_IoU.reset_index(inplace = True, drop = True)
#    return manual_df_with_IoU


# def class_IoU_Statistics(automated_df,manual_df,threshold = 0.5):
#    """
#    Wrapper function that takes matrix_IoU_Scores across multiple clips from a
#    class. Allows user to modify the threshold that determines whether or not
#    a label is a true positive.

#    Args:
#         automated_df (Dataframe)
#             - Dataframe of automated labels for multiple
#                                   audio clips.

#         manual_df (Dataframe)
#             - Dataframe of human labels for multiple audio clips.

#         threshold (float)
#             - IoU threshold for determining true positives, false positives,
#               and false negatives.

#    Returns:
#        Dataframe of IoU statistics for multiple audio clips.
#    """
#    # isolating the names of the clips that have been labelled into an array.
#    clips = automated_df["IN FILE"].to_list()
#    clips = list(dict.fromkeys(clips))
#    # initializing the output Pandas dataframe
#    # Looping through all of the clips
#    for clip in clips:
#        print(clip)
#        clip_automated_df = automated_df[automated_df["IN FILE"] == clip]
#        clip_manual_df = manual_df[manual_df["IN FILE"] == clip]
#        # Computing the IoU Matrix across a specific clip
#        IoU_Matrix = clip_IoU(clip_automated_df,clip_manual_df)
#        # Calculating the best fit IoU to each label for the clip
#        clip_stats_df = matrix_IoU_Scores(IoU_Matrix,clip_manual_df,threshold)
#        # adding onto the output array.
#        if IoU_Statistics.empty == True:
#            IoU_Statistics = clip_stats_df
#        else:
#            IoU_Statistics = IoU_Statistics.append(clip_stats_df)
#    IoU_Statistics.reset_index(inplace = True, drop = True)
#    return IoU_Statistics

# Consider adding in a new manual_id parameter here
def global_statistics(statistics_df, manual_id = 'N/A'):
    """
    Function that takes the output of dataset_IoU Statistics and outputs a
    global count of true positives and false positives, as well as computing \
    the precision, recall, and f1 metrics across the dataset.
    Args:
        statistics_df (Dataframe)
            - Dataframe of matrix IoU scores for multiple clips.
    Returns:
        Dataframe of global IoU statistics which include the number of true
        positives, false positives, and false negatives. Contains Precision,
        Recall, and F1 metrics as well
    """

    #data_class = statistics_df["MANUAL ID"][0]
    # taking the sum of the number of true positives and false positives.
    tp_sum = statistics_df["TRUE POSITIVE"].sum()
    fn_sum = statistics_df["FALSE NEGATIVE"].sum()
    fp_sum = statistics_df["FALSE POSITIVE"].sum()
    # calculating the precision, recall, and f1
    try:
        precision = tp_sum / (tp_sum + fp_sum)
        recall = tp_sum / (tp_sum + fn_sum)
        f1 = 2 * (precision * recall) / (precision + recall)
    except ZeroDivisionError:
        print('''Error in calculating Precision, Recall, and F1. Likely due to
        zero division, setting values to zero''')
        precision = 0
        recall = 0
        f1 = 0
    # building a dictionary of the above calculations
    entry = {'MANUAL ID': manual_id,
             'TRUE POSITIVE': tp_sum,
             'FALSE NEGATIVE': fn_sum,
             'FALSE POSITIVE': fp_sum,
             'PRECISION': round(precision, 4),
             'RECALL': round(recall, 4),
             'F1': round(f1, 4)}
    # returning the dictionary as a pandas dataframe
    return pd.DataFrame.from_dict([entry])


def dataset_Catch(automated_df, manual_df):
    """
    Function that determines the overlap of each human label with respect to
    all of the human labels in a clip across a large number of clips.
    Args:
        automated_df (Dataframe)
            - Dataframe of automated labels for multiple audio clips.
        manual_df (Dataframe)
            - Dataframe of human labels for multiple audio clips.
    Returns:
        Dataframe of human labels with a column for the catch values of each
        label.
    """
    # Getting a list of clips
    clips = automated_df["IN FILE"].to_list()
    # Removing duplicates
    clips = list(dict.fromkeys(clips))
    # Initializing the ouput dataframe
    manual_df_with_Catch = pd.DataFrame()
    # Looping through all of the audio clips that have been labelled.
    for clip in clips:
        print(clip)
        # Isolating the clips from both the automated and human dataframes
        clip_automated_df = automated_df[automated_df["IN FILE"] == clip]
        clip_manual_df = manual_df[manual_df["IN FILE"] == clip]
        # Calling the function that calculates the catch over a specific clip
        Catch_Array = clip_catch(clip_automated_df, clip_manual_df)
        # Appending the catch values per label onto the manual dataframe
        clip_manual_df["Catch"] = Catch_Array
        if manual_df_with_Catch.empty:
            manual_df_with_Catch = clip_manual_df
        else:
            manual_df_with_Catch = manual_df_with_Catch.append(clip_manual_df)
    # Resetting the indices
    manual_df_with_Catch.reset_index(inplace=True, drop=True)
    return manual_df_with_Catch



# Goes through each class, measuring how effective the labels are in each clip
def clip_statistics(automated_df,manual_df, stats_type = "IoU", threshold = 0.5):
    # Creating identifying the overlapping classes between the two sets of dataframes
    
    # Creating a list of classes from the automated dataframe
    automated_class_list = automated_df["MANUAL ID"].to_list()
    automated_class_list = list(dict.fromkeys(automated_class_list))
    # Creating a list of classes from the manual dataframe
    manual_class_list = manual_df["MANUAL ID"].to_list()
    manual_class_list = list(dict.fromkeys(manual_class_list))
    # Finding the intersection between the manual and automated classes
    class_list = np.intersect1d(automated_class_list,manual_class_list)
    
    # Initializing the output dataframe
    clip_statistics = pd.DataFrame()
    # Looping through each class and comparing the automated labels to the manual labels
    for class_ in class_list:
        #print(class_)
        # isolating the current class of interest
        temp_manual_class_df = manual_df[manual_df["MANUAL ID"] == class_]
        temp_automated_class_df = automated_df[automated_df["MANUAL ID"] == class_]
        # The case if clip_statistics hasn't been filled yet
        if clip_statistics.empty:
            clip_statistics = automated_labeling_statistics(temp_automated_class_df, temp_manual_class_df, stats_type = stats_type, threshold = threshold)
        else:
            temp_df = automated_labeling_statistics(temp_automated_class_df, temp_manual_class_df, stats_type = stats_type, threshold = threshold)
            clip_statistics = clip_statistics.append(temp_df)
    clip_statistics.reset_index(inplace=True,drop=True)
    return clip_statistics

def class_statistics(clip_statistics):
    # Initializing the output dataframe
    class_statistics = pd.DataFrame()
    # creating a list of the unique classes being passed in.
    class_list = clip_statistics["MANUAL ID"].to_list()
    class_list = list(dict.fromkeys(class_list))
    for class_ in class_list:
        #print(class_)
        # isolating the current class of interest
        class_df = clip_statistics[clip_statistics["MANUAL ID"] == class_]
        if class_statistics.empty:
            class_statistics = global_statistics(class_df, manual_id = class_)
        else:
            temp_df = global_statistics(class_df, manual_id = class_)
            class_statistics = class_statistics.append(temp_df)
        class_statistics.reset_index(inplace=True,drop=True)
        return class_statistics
