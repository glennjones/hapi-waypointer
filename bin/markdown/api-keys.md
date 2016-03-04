There are two main approaches to obtaining a token to call the API:

Use the Token Generator on the top-left of this page

* Construct and sign a JWT yourself using http://jwt.io or any of the listed JWT libraries
* Whatever approach you choose, we recommend storing tokens in your application directly, and not generating them dynamically using your API secret.

Tokens created with the Token Generator in this page do not contain an exp claim, which means they never expire. You can use the Token Generator
to create tokens for your production application without writing any code.