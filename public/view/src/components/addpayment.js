import React, { Component } from "react";

import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import {
  Card,
  CardActions,
  CardContent,
  Divider,
  Button,
  Grid,
  TextField,
  Avatar,
} from "@material-ui/core";

import Select, { SelectChangeEvent } from "@material-ui/core/Select";

import clsx from "clsx";

import axios from "axios";
import { authMiddleWare } from "../util/auth";

const styles = (theme) => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  actions: {
    display: "flex",
    padding: "8px",
    justifyContent: "right",
  },
  row: {
    marginBottom: "20px",
  },
  toolbar: theme.mixins.toolbar,
  root: {},
  details: {
    display: "flex",
  },
  avatar: {
    height: 110,
    width: 100,
    flexShrink: 0,
    flexGrow: 0,
  },
  locationText: {
    paddingLeft: "15px",
  },
  buttonProperty: {
    position: "absolute",
    top: "50%",
  },
  uiProgess: {
    position: "fixed",
    zIndex: "1000",
    height: "31px",
    width: "31px",
    left: "50%",
    top: "50%",
  },
  progess: {
    position: "absolute",
  },
  uploadButton: {
    marginLeft: "8px",
    margin: theme.spacing(1),
  },
  customError: {
    color: "red",
    fontSize: "0.8rem",
    marginTop: 10,
  },
  submitButton: {
    marginTop: "0px",
  },
});

class addpayment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: "",
      selectedCategory: "",
      selectedOwner: 0,
      description: "",
      username: "",
      country: "",
      profilePicture: "",
      uiLoading: true,
      buttonLoading: false,
      imageError: "",
      owners: [],
      categories: [],
    };
  }

  componentWillMount = () => {
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios
      .get("https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/user")
      .then((response) => {
        console.log(response.data);
        this.setState({
          firstName: response.data.userCredentials.firstName,
          lastName: response.data.userCredentials.lastName,
          email: response.data.userCredentials.email,
          phoneNumber: response.data.userCredentials.phoneNumber,
          country: response.data.userCredentials.country,
          username: response.data.userCredentials.username,
          uiLoading: false,
        });
      })
      .catch((error) => {
        if (error.response.status === 403) {
          this.props.history.push("/login");
        }
        console.log(error);
        this.setState({ errorMsg: "Error in retrieving the data" });
      });

    axios
      .get(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/owners"
      )
      .then((response) => {
        this.setState({
          owners: response.data,
          uiLoading: false,
        });
      })
      .catch((err) => {
        console.log(err);
      });

    axios
      .get(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/collections"
      )
      .then((response) => {
        this.setState({
          categories: response.data,
          uiLoading: false,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleImageChange = (event) => {
    this.setState({
      image: event.target.files[0],
    });
  };

  handleSubmit = (event) => {
    authMiddleWare(this.props.history);
    event.preventDefault();
    const userTodo = {
      title: this.state.title,
      body: this.state.body,
    };
    this.setState({ uiLoading: true });
    const userPayment = {
      TransactionBy: this.state.selectedOwner,
      Category: this.state.selectedCategory,
      Description: this.state.description,
      Amount: this.state.amount,
    };
    let options = {};
    if (this.state.buttonType === "Edit") {
      options = {
        url: `https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payment/${this.state.todoId}`,
        method: "put",
        data: userPayment,
      };
    } else {
      options = {
        url: "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payment",
        method: "post",
        data: userPayment,
      };
    }
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios(options)
      .then(() => {
        this.setState({ open: false });

        authMiddleWare(this.props.history);
        const authToken = localStorage.getItem("AuthToken");
        axios.defaults.headers.common = { Authorization: `${authToken}` };
        axios
          .get(
            "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payments"
          )
          .then((response) => {
            this.props.loadPayment();
          })
          .catch((err) => {
            console.log(err);
          });
        //window.location.reload();
      })
      .catch((error) => {
        this.setState({ open: true, errors: error.response.data });
        console.log(error);
      });
  };

  profilePictureHandler = (event) => {
    event.preventDefault();
    this.setState({
      uiLoading: true,
    });
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    let form_data = new FormData();
    form_data.append("image", this.state.image);
    form_data.append("content", this.state.content);
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios
      .post(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/user/image",
        form_data,
        {
          headers: {
            "content-type": "multipart/form-data",
          },
        }
      )
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        if (error.response.status === 403) {
          this.props.history.push("/login");
        }
        console.log(error);
        this.setState({
          uiLoading: false,
          imageError: "Error in posting the data",
        });
      });
  };

  renderCategoryOptions() {
    var categorySelect = [
      ...[{ collectionId: 0, collectionName: "Select a Category" }],
      ...this.state.categories,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <option
          label={dt.collectionName}
          value={dt.collectionId}
          key={i}
          name={dt.collectionName}
        >
          {dt.collectionName}
        </option>
      );
    });
  }

  renderOwnerOptions() {
    if (this.state.owners)
      var categorySelect = [
        ...[{ ownerId: 0, ownerName: "Select Owner" }],
        ...this.state.owners,
      ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <option
          label={dt.ownerName}
          value={dt.ownerId}
          key={i}
          name={dt.ownerName}
        >
          {dt.ownerName}
        </option>
      );
    });
  }

  updateFormValues = (event) => {
    event.preventDefault();
    this.setState({ buttonLoading: true });
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    const formRequest = {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      country: this.state.country,
    };
    axios
      .post(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/user",
        formRequest
      )
      .then(() => {
        this.setState({ buttonLoading: false });
      })
      .catch((error) => {
        if (error.response.status === 403) {
          this.props.history.push("/login");
        }
        console.log(error);
        this.setState({
          buttonLoading: false,
        });
      });
  };

  render() {
    const { classes, ...rest } = this.props;
    if (this.state.uiLoading === true) {
      return (
        <main className={classes.content}>
          <div className={classes.toolbar} />
          {this.state.uiLoading && (
            <CircularProgress size={50} className={classes.uiProgess} />
          )}
        </main>
      );
    } else {
      return (
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <div className="row">
            <div className="col-md-1 col-sm-12 col-xs-12"></div>
            <div className="col-md-6 col-sm-12 col-xs-12">
              <Card {...rest} className={clsx(classes.root, classes)}>
                <form autoComplete="off" noValidate>
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Owner</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <select
                          class="form-select"
                          aria-label="Default select example"
                          onChange={(event) =>
                            this.setState({
                              selectedOwner: event.target.value,
                            })
                          }
                          value={this.state.selectedOwner}
                        >
                          {this.renderOwnerOptions()}
                        </select>
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Description</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="Description"
                          onChange={(event) =>
                            this.setState({ description: event.target.value })
                          }
                          value={this.state.description}
                          className="form-control"
                        />
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Category</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <select
                          class="form-select"
                          aria-label="Default select example"
                          onChange={(event) =>
                            this.setState({
                              selectedCategory: event.target.value,
                            })
                          }
                          value={this.state.selectedCategory}
                        >
                          {this.renderCategoryOptions()}
                        </select>
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Amount</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="Amount"
                          onChange={(event) =>
                            this.setState({ amount: event.target.value })
                          }
                          value={this.state.amount}
                          className="form-control"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Divider />
                  <CardActions className={classes.actions}>
                    <Button
                      color="primary"
                      variant="contained"
                      type="submit"
                      className={classes.submitButton}
                      onClick={this.handleSubmit}
                      disabled={
                        this.state.buttonLoading ||
                        !this.state.firstName ||
                        !this.state.lastName ||
                        !this.state.country
                      }
                    >
                      Submit
                      {this.state.buttonLoading && (
                        <CircularProgress
                          size={30}
                          className={classes.progess}
                        />
                      )}
                    </Button>
                  </CardActions>
                </form>
              </Card>
            </div>
          </div>

          <br />
        </main>
      );
    }
  }
}

export default withStyles(styles)(addpayment);
