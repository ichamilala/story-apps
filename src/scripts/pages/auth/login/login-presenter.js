export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.login({ email, password });

      console.log('Login response:', response);

      if (!response.ok) {
        console.error('getLogin: response:', response);
        this.#view.loginFailed(response.message);
        return;
      }

      if (!response.loginResult || !response.loginResult.token) {
        console.error('Login response missing token:', response);
        this.#view.loginFailed('Login gagal: token tidak ditemukan.');
        return;
      }

      const { token: accessToken, ...userData } = response.loginResult;
      this.#authModel.putAccessToken(accessToken);
      this.#view.loginSuccessfully(response.message, userData);



    } catch (error) {
      console.error('getLogin: error:', error);
      this.#view.loginFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }


}
