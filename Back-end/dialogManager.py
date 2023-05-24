import informative
from app import get_response

def generateResponseAndState(state,previous_products,intend,question_dict,has_image,profile,question):
    if state=="greetings":
        return generateGreetingsResponse(intend,question_dict,has_image,profile,question)
    elif state=="retrieval":
        return generateRetrievalResponse(intend,previous_products,question_dict,has_image,profile,question)
    elif state=="information":
        return generateInformationResponse(intend,previous_products,question_dict,has_image,profile,question)
    elif state=="exit":
        return generateExitResponse()
    else:
        print("Error: State not found")
        return "Error: State not found"
    

def generateGreetingsResponse(intend,question_dict,has_image,profile,question):
    if intend=="user_neutral_goodbye":
        return "exit","Goodbye, sorry to see you leave this early, I hope I was helpful.",None
    elif intend=="user_neutral_greeting":
        return "greetings","Hi, I am a chatbot. Ask me anything about fashion!",None
    elif "user_neutral" in intend:
        return "greetings","Sorry, I wasn't prepared to answer those kind of question, can you rephrase it ?",None
    elif intend=="user_request_get_products":
        temp = get_response(question_dict,has_image,question,profile)
        return "retrieval", temp[0],temp[1]
    elif "user_qa" in intend or "user_inform" in intend:
        return "greetings","You first need to ask me to get a product.",None
    else:
        print("Error: Intend not found in generateGreetingsResponse")
        return "Error: Intend not found in generateGreetingsResponse"
        

def generateRetrievalResponse(intend,previous_products,question_dict,has_image,profile,question):
    if intend=="user_neutral_goodbye":
        return "exit","Goodbye, I hope I was helpful.",None
    elif "user_neutral" in intend:
        return "retrieval","Sorry, I wasn't prepared to answer those kind of question, can you rephrase it ?",None
    elif intend=="user_request_get_products":
        temp = get_response(question_dict,has_image,question,profile)
        return "retrieval", temp[0], temp[1]
    elif "user_qa" in intend or "user_inform" in intend:
        return "information", informative.getInformativeText(previous_products,intend),None
    else:
        print("Error: Intend not found in generateRetrievalResponse")
        return "Error: Intend not found in generateRetrievalResponse"

def generateInformationResponse(intend,previous_products,question_dict,has_image,profile,question):
    if intend=="user_neutral_goodbye":
        return "exit","Goodbye, I hope I was helpful.",None
    elif "user_neutral" in intend:
        return "information","Sorry, I wasn't prepared to answer those kind of question, can you rephrase it ?",None
    elif intend=="user_request_get_products":
        temp = get_response(question_dict,has_image,question,profile)
        return "retrieval", temp[0],temp[1]
    elif "user_qa" in intend or "user_inform" in intend:
        return "information", informative.getInformativeText(previous_products,intend),None
    else:
        print("Error: Intend not found in generateInformationResponse")
        return "Error: Intend not found in generateInformationResponse"

def generateExitResponse():
    return "exit","I can't respond anymore, you have exit the chatbot.",None

