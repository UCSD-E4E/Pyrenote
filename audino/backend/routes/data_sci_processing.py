import sqlalchemy as sa
from sqlalchemy import or_, and_, not_
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
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
import math
from sklearn import metrics

@api.route("/update_confidence/<int:project_id>/<int:data_id>", methods=["PUT"])
@jwt_required
def update_confidence_api(project_id, data_id):
    identity = get_jwt_identity()
    username = identity["username"]
    return update_confidence(project_id, data_id, username)

def update_confidence(project_id, data_id, username):
    app.logger.info("CHANGED CONFIDENCE LEVEL +")
    project = Project.query.get(project_id)
    if not project.is_iou:
        return jsonify(message="iou meterics not used"), 202
    data_pt = Data.query.get(data_id)
    
    data_pt.set_previous_users(username)
    flag_modified(data_pt, "users_reviewed") 
    db.session.add(data_pt)  
    db.session.commit()
    db.session.refresh(data_pt)

    scores = np.array([])
    segmentations = Segmentation.query.filter_by(data_id=data_id).distinct()
    df = make_dataframe(segmentations)


    for manual_id in df["MANUAL ID"].unique():
        tmp_df = df[df["MANUAL ID"] == manual_id]   
        model, clusters,  data_processed, silhoutte = run_clustering(DBSCAN_auto_dis_builder_min_dis2, tmp_df, np.unique(tmp_df["LAST MOD BY"]))
        
        def label_cluster(row):
          segment = Segmentation.query.get(row["ID"])
          segment.set_counted(row["cluster"])
          db.session.add(segment)
          return row
        
        data_processed.apply(label_cluster, axis=1)
        scores = np.append(scores,  silhoutte[0])
    
    confidence = scores.mean()
    data_pt.set_confidence(float(confidence))
    app.logger.info(confidence)
    app.logger.info(scores)
    flag_modified(data_pt, "users_reviewed") 
    flag_modified(data_pt, "confidence") 
    db.session.add(data_pt)  
    db.session.commit()
    db.session.refresh(data_pt)

    app.logger.info("CHANGED CONFIDENCE LEVEL")
    app.logger.info(data_pt.confidence)
    return 200



def make_dataframe(segmentations):
    OFFSET = []
    END = []
    MANUAL_ID = []
    ANNOTATION_ID = []
    LAST_MOD=[]

    
    for segment in segmentations:
        start = segment.start_time
        end = segment.end_time
        if (len(segment.values) == 0):
            ANNOTATION_ID.append(segment.id)
            OFFSET.append(start)
            END.append(end)
            MANUAL_ID.append("No class of interest")
            LAST_MOD.append(segment.created_by)

        for labelCate in segment.values:
            #for values in labelCate["values"]:
                    #TODO HANDLE EDGE CASES OF MUTLIPLE VALUES OF LABELS
                    ANNOTATION_ID.append(segment.id)
                    manual_id = labelCate.value
                    OFFSET.append(start)
                    END.append(end)
                    MANUAL_ID.append(manual_id)
                    LAST_MOD.append(segment.created_by)
    df = {
      "ID":tuple(ANNOTATION_ID),  
      "OFFSET":  tuple(OFFSET), 
      "END TIMES": tuple(END), 
      "MANUAL ID":  tuple(MANUAL_ID),
      "LAST MOD BY": tuple(LAST_MOD)
    }
    return pd.DataFrame.from_dict(df)




def run_clustering(model_builder, data_oi, users, distance=1/2, agreement=1, duration=True,  figure=1, verbose=False):
  neighborhood_size, model = model_builder(data = data_oi, distance = distance, users = users, agreement = agreement)
  if verbose:
    print("neighborhood size: ", neighborhood_size)
  clusters = model.fit_predict(data_oi[["OFFSET", "END TIMES"]])
  data_oi["cluster"] = clusters
 

  adv_cluster_count = 0
  adv_num_unique_users = 0 
  for i in range(max(clusters)):
     temp = data_oi[data_oi["cluster"] == i]
     adv_cluster_count += len(temp)
     adv_num_unique_users += len(pd.unique(temp['LAST MOD BY']))
     #print(get_longest_distance(temp, "OFFSET", "END TIMES"))
  adv_cluster_count /= int(max(clusters) + 1)
  adv_num_unique_users /=  int(max(clusters) + 1) #TEMP FIX INVESTIAGE HERE


  if (verbose):       
    print(clusters)
    print("adverage cluster size: ", adv_cluster_count)
    print("adverage unqiue users per cluster size: ", adv_num_unique_users)
  
  silhoutte = 0
  silhoutte_users = 0
  try:
    #vr = metrics.calinski_harabasz_score(data_oi[["OFFSET", "END TIMES", "DURATION"]], clusters)
    silhoutte = metrics.silhouette_score(data_oi[["OFFSET", "END TIMES"]], clusters)
    silhoutte = (silhoutte + 1 )/2
    silhoutte_users = (silhoutte + adv_num_unique_users/len(users))/2

    if (verbose):  
      print("Variance Ratio Criterion", vr) 
      print("Note that VRC is less for DBSCAN in general")
      print("========================================") 
      print("Silhoutte Score              : ",silhoutte )
      print("Silhoutte Score scaled 0 - 1 : ",(silhoutte + 1 )/2)
      print("scaled avg Silhoutte users   : ",((silhoutte + 1 )/2+adv_num_unique_users/len(users))/2)
      
  except:
    if (verbose):  
      print("ERROR: not enough clusters to create meterics")

  return model, clusters, data_oi, (silhoutte, silhoutte_users)




def DBSCAN_auto_dis_builder_min_dis2(data = None, distance = 1, users = None, agreement = 0.5, duration=False):
    NEIGHBORHOOD_SCALAR = distance

    n = 0
    adv_distance = []
    dists_raw = []
    for i in range(len(users)):
      user_labels = data[data['LAST MOD BY'] == users[i]]
      s1 = 0
      e1 = 0
      s2 = 0
      e2 = 0
      d1 = 0
      d2 = 0
      skip = True
      for index, row in user_labels.iterrows():
        #print(s1,e1,s2,e2)
        s2 = float(row["OFFSET"])
        e2 = float(row["END TIMES"])
        dist = distance_cal2(s1,e1,s2,e2)
        if (not skip):
          dists_raw.append(dist)
        
        skip = False
        s1 = s2
        e1 = e2
        d1 = d2

    if len(dists_raw) == 0:
      dists_raw.append(1) #TODO: Investigate edge case
    adv_distance = min(dists_raw) #* NEIGHBORHOOD_SCALAR #
    return adv_distance, DBSCAN(
                    eps=adv_distance*0.9, 
                    min_samples=2,
                  )

def distance_cal2(s1,e1,s2,e2):
  return math.sqrt((s2 - s1) * (s2 - s1) + (e2 - e1) * (e2 - e1) )

def distance_cal3(s1,e1,s2,e2, d1, d2):
  return math.sqrt((s2 - s1) * (s2 - s1) + (e2 - e1) * (e2 - e1) + (d2 - d1) * (d2 - d1)) 


