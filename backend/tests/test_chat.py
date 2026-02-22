def test_send_message_requires_subscription(client, auth_headers):
    response = client.post(
        "/api/chat/send",
        headers=auth_headers,
        json={"message": "What is the price of AAPL?"},
    )
    assert response.status_code == 403
    assert "subscription" in response.json()["detail"].lower()


def test_list_conversations_requires_subscription(client, auth_headers):
    response = client.get("/api/chat/conversations", headers=auth_headers)
    assert response.status_code == 403


def test_list_conversations_empty(client, subscribed_headers):
    response = client.get("/api/chat/conversations", headers=subscribed_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_delete_nonexistent_conversation(client, subscribed_headers):
    response = client.delete("/api/chat/conversations/999", headers=subscribed_headers)
    assert response.status_code == 404
