import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

async def get_content_based_recommendations(target_product_id: str, collection, top_n: int = 5):
    products = []
    cursor = collection.find({})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        products.append(document)
        
    if len(products) < 2:
        return [] 

    df = pd.DataFrame(products)

    df['description'] = df['description'].fillna("")

    df['combined_features'] = df['name'] + " " + df['category'] + " " + df['description']

    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])

    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    try:
        idx = df.index[df['_id'] == target_product_id].tolist()[0]
    except IndexError:
        return [] 

    sim_scores = list(enumerate(cosine_sim[idx]))

    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    sim_scores = sim_scores[1:top_n+1]

    product_indices = [i[0] for i in sim_scores]

    recommended_df = df.iloc[product_indices][['_id', 'name', 'category', 'price', 'stock']]

    return recommended_df.to_dict('records')