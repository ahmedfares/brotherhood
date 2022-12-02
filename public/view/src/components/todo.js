import React, { Component } from "react";

import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import Select, { SelectChangeEvent } from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Dialog from "@material-ui/core/Dialog";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Slide from "@material-ui/core/Slide";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CircularProgress from "@material-ui/core/CircularProgress";
import CardContent from "@material-ui/core/CardContent";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";

import {
  Chart,
  PieSeries,
  Title,
  Tooltip,
} from "@devexpress/dx-react-chart-material-ui";

import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { authMiddleWare } from "../util/auth";
import { blue, green, red } from "@material-ui/core/colors";
// import Chart from "react-google-charts";

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}
const rows = [
  {
    name: "Ahmed",
    calories: 98,
  },
];

const styles = (theme) => ({
  centerInput: { display: "flex", justifyContent: "center" },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  toolbar: theme.mixins.toolbar,
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  submitButton: {
    display: "block",
    color: "white",
    textAlign: "center",
    position: "absolute",
    top: 14,
    right: 10,
  },
  form: {
    width: "98%",
    marginLeft: 13,
    marginTop: theme.spacing(10),
  },
  toolbar: theme.mixins.toolbar,
  root: {
    minWidth: 470,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  pos: {
    marginBottom: 12,
  },
  uiProgess: {
    position: "fixed",
    zIndex: "1000",
    height: "31px",
    width: "31px",
    left: "50%",
    top: "35%",
  },
  dialogeStyle: {
    maxWidth: "50%",
  },
  viewRoot: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

class todo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      todos: [],
      payments: [],
      selectedPayments: [],
      paymentBy: "",
      description: "",
      category: "",
      amount: "",
      categories: [],
      owners: [],
      title: "",
      body: "",
      todoId: "",
      errors: [],
      open: false,
      uiLoading: true,
      selectedOwner: 0,
      selectedCategory: 0,
      buttonType: "",
      viewOpen: false,
      selectedPaymentTime: 0,
      selectedPaymentOwner: 0,
      selectedPaymentCategory: 0,
    };

    this.deleteTodoHandler = this.deleteTodoHandler.bind(this);
    this.handleEditClickOpen = this.handleEditClickOpen.bind(this);
    this.handleViewOpen = this.handleViewOpen.bind(this);
  }

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleOwnerSelectChange = (event) => {
    this.setState({
      selectedOwner: event.target.value,
      name: event.target.name,
    });
  };

  handleCategorySelectChange = (event) => {
    this.setState({
      selectedCategory: event.target.value,
      name: event.target.name,
    });
  };

  componentWillMount = () => {
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios
      .get(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payments"
      )
      .then((response) => {
        this.setState({
          payments: response.data,
          selectedPayments: response.data,
          uiLoading: false,
        });
      })
      .catch((err) => {
        console.log(err);
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

  deleteTodoHandler(data) {
    if (window.confirm("Are you sure you want to delete this item ?")) {
      authMiddleWare(this.props.history);
      const authToken = localStorage.getItem("AuthToken");
      axios.defaults.headers.common = { Authorization: `${authToken}` };
      let paymentId = data.payment.paymentId;
      axios
        .delete(
          `https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payment/${paymentId}`
        )
        .then(() => {
          axios
            .get(
              "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payments"
            )
            .then((response) => {
              this.setState({
                payments: response.data,
                uiLoading: false,
              });
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  handleEditClickOpen(data) {
    this.setState({
      title: data.todo.title,
      body: data.todo.body,
      todoId: data.todo.todoId,
      buttonType: "Edit",
      open: true,
    });
  }

  handleViewOpen(data) {
    this.setState({
      title: data.todo.title,
      body: data.todo.body,
      viewOpen: true,
    });
  }

  renderCategoryOptions() {
    var categorySelect = [
      ...[{ collectionId: 0, collectionName: "Select a Category" }],
      ...this.state.categories,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <MenuItem
          label="Select a category"
          value={dt.collectionId}
          key={i}
          name={dt.collectionName}
        >
          {dt.collectionName}
        </MenuItem>
      );
    });
  }

  renderOwnerOptions() {
    var categorySelect = [
      ...[{ ownerId: 0, ownerName: "Select Owner" }],
      ...this.state.owners,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <MenuItem
          label="Select owner"
          value={dt.ownerId}
          key={i}
          name={dt.ownerName}
        >
          {dt.ownerName}
        </MenuItem>
      );
    });
  }

  renderPaymentOwnerOptions() {
    var categorySelect = [
      ...[{ ownerId: 0, ownerName: "All Owners" }],
      ...this.state.owners,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <option value={dt.ownerId} key={i} name={dt.ownerName}>
          {dt.ownerName}
        </option>
      );
    });
  }

  renderPaymentCategoryOptions() {
    var categorySelect = [
      ...[{ collectionId: 0, collectionName: "All Categories" }],
      ...this.state.categories,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <option value={dt.collectionId} key={i} name={dt.collectionName}>
          {dt.collectionName}
        </option>
      );
    });
  }

  render() {
    const DialogTitle = withStyles(styles)((props) => {
      const { children, classes, onClose, ...other } = props;

      return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
          <Typography variant="h6">{children}</Typography>
          {onClose ? (
            <IconButton
              aria-label="close"
              className={classes.closeButton}
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          ) : null}
        </MuiDialogTitle>
      );
    });

    const DialogContent = withStyles((theme) => ({
      viewRoot: {
        padding: theme.spacing(2),
      },
    }))(MuiDialogContent);

    dayjs.extend(relativeTime);
    const { classes } = this.props;
    const { open, errors, viewOpen } = this.state;

    const handleClickOpen = () => {
      this.setState({
        todoId: "",
        title: "",
        body: "",
        buttonType: "",
        open: true,
        paymentTime: "Payment Time",
      });
    };

    const handleSubmit = (event) => {
      authMiddleWare(this.props.history);
      event.preventDefault();
      const userTodo = {
        title: this.state.title,
        body: this.state.body,
      };
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
              this.setState({
                payments: response.data,
                uiLoading: false,
              });
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

    const handleViewClose = () => {
      this.setState({ viewOpen: false });
    };

    const handleClose = (event) => {
      this.setState({ open: false });
    };

    const handleOwnerPaymentChange = (event) => {
      if (event != null) {
        this.setState(
          { selectedPaymentOwner: event.target.value },
          function () {
            filterPayment();
          }
        );
      }
    };
    const handleCategoryPaymentChange = (event) => {
      if (event != null) {
        this.setState(
          { selectedPaymentCategory: event.target.value },
          function () {
            filterPayment();
          }
        );
      }
    };
    const filterPayment = () => {
      let newDate;
      const now = new Date();
      if (this.state.selectedPaymentTime == 1) {
        newDate = now.setFullYear(now.getFullYear() - 1);
      } else if (this.state.selectedPaymentTime == 2) {
        newDate = now.setMonth(now.getMonth() - 1);
      } else if (this.state.selectedPaymentTime == 3) {
        newDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (this.state.selectedPaymentTime == 4) {
        newDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      let newPaymentTime = this.state.payments
        .filter((x) => new Date(x.TransactionDate) > newDate || !newDate)
        .filter(
          (x) =>
            x.TransactionBy == this.state.selectedPaymentOwner ||
            this.state.selectedPaymentOwner == 0
        )
        .filter(
          (x) =>
            x.Category == this.state.selectedPaymentCategory ||
            this.state.selectedPaymentCategory == 0
        );
      this.setState({
        selectedPayments: newPaymentTime,
      });
    };
    const handlePaymentChange = (event) => {
      if (event)
        this.setState({ selectedPaymentTime: event.target.value }, function () {
          filterPayment();
        });
    };

    const handleChange2 = (event) => {
      this.setState({ paymentTime: event.target.value });
    };

    if (this.state.uiLoading === true) {
      return (
        <main className={classes.content}>
          <div className={classes.toolbar} />
          {this.state.uiLoading && (
            <CircularProgress size={150} className={classes.uiProgess} />
          )}
        </main>
      );
    } else {
      const categoryData = [];
      const ownerData = [];

      if (
        this.state.owners.length > 0 &&
        this.state.categories.length > 0 &&
        this.state.payments.length > 0
      ) {
        this.state.payments
          .map((obj) => ({
            ...obj,
            CategoryName: this.state.categories.find(
              (x) => x.collectionId == obj.Category
            ).collectionName,
          }))
          .reduce(function (res, value) {
            if (!res[value.CategoryName]) {
              res[value.CategoryName] = {
                argument: value.CategoryName,
                value: value.Amount,
              };
              categoryData.push(res[value.CategoryName]);
            }
            res[value.CategoryName].Amount =
              Number(value.Amount) +
              (res[value.CategoryName].Amount
                ? Number(res[value.CategoryName].Amount)
                : 0);
            res[value.CategoryName].value = res[value.CategoryName].Amount;
            return res;
          }, {});

        this.state.payments
          .map((obj) => ({
            ...obj,
            OwnerName: this.state.owners.find(
              (x) => x.ownerId == obj.TransactionBy
            ).ownerName,
          }))
          .reduce(function (res, value) {
            if (!res[value.OwnerName]) {
              res[value.OwnerName] = {
                argument: value.OwnerName,
                value: value.Amount,
              };
              ownerData.push(res[value.OwnerName]);
            }
            res[value.OwnerName].Amount =
              Number(value.Amount) +
              (res[value.OwnerName].Amount
                ? Number(res[value.OwnerName].Amount)
                : 0);
            res[value.OwnerName].value = res[value.OwnerName].Amount;
            return res;
          }, {});
      }

      const expectedData = [
        { argument: "Food", value: 500 },
        { argument: "Rent", value: 1200 },
        { argument: "Electricity", value: 100 },
        { argument: "Internet", value: 40 },
        { argument: "Charity", value: 1200 },
        { argument: "Fuel", value: 100 },
        { argument: "Insurance", value: 75 },
        { argument: "Expenses", value: 285 },
      ];
      return (
        <div>
          <div className={classes.toolbar} />

          <div className="row">
            <div
              className="col-md-3 col-sm-6 col-xs-12"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <select
                className="form-select form-select-lg mb-3"
                aria-label=".form-select-lg example"
                style={{ width: "200px", display: "inline" }}
                onChange={handlePaymentChange}
              >
                <option value="0" selected>
                  All Payments
                </option>
                <option value="1">Last Year</option>
                <option value="2">Last Month</option>
                <option value="3">Last Week</option>
                <option value="4">Last Day</option>
              </select>
            </div>
            <div
              className="col-md-3 col-sm-6 col-xs-12"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <select
                className="form-select form-select-lg mb-3"
                aria-label=".form-select-lg example"
                style={{ width: "200px", display: "inline" }}
                onChange={handleCategoryPaymentChange}
              >
                {this.renderPaymentCategoryOptions()}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-6 col-xs-12"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <select
                className="form-select form-select-lg mb-3"
                aria-label=".form-select-lg example"
                style={{ width: "200px", display: "inline" }}
                onChange={handleOwnerPaymentChange}
              >
                {this.renderPaymentOwnerOptions()}
              </select>
            </div>
            <div
              className="col-md-3 col-sm-6 col-xs-12"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <button
                className="btn btn-primary"
                aria-label="Add Payment"
                onClick={handleClickOpen}
                style={{ marginBottom: "20px" }}
              >
                Add Payment
              </button>
            </div>
          </div>
          <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            TransitionComponent={Transition}
          >
            <AppBar color="primary" className={classes.appBar}>
              <Toolbar>
                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={handleClose}
                  aria-label="close"
                >
                  <CloseIcon />
                </IconButton>
                <Typography variant="h6" className={classes.title}>
                  {this.state.buttonType === "Edit"
                    ? "Edit Todo"
                    : "Add Payment"}
                </Typography>
                <Button
                  autoFocus
                  color="inherit"
                  onClick={handleSubmit}
                  className={classes.submitButton}
                >
                  {this.state.buttonType === "Edit" ? "Save" : "Submit"}
                </Button>
              </Toolbar>
            </AppBar>

            <form className={classes.form} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Select
                    variant="outlined"
                    required
                    fullWidth
                    id="paymentBy"
                    label="paymentBy"
                    name="paymentBy"
                    autoComplete="paymentBy"
                    helperText={errors.paymentBy}
                    value={this.state.selectedOwner}
                    onChange={this.handleOwnerSelectChange}
                  >
                    {this.renderOwnerOptions()}
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="description"
                    label="Description"
                    name="description"
                    autoComplete="description"
                    helperText={errors.description}
                    value={this.state.description}
                    error={errors.description ? true : false}
                    onChange={this.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Select
                    variant="outlined"
                    required
                    fullWidth
                    id="category"
                    label="Category"
                    name="category"
                    autoComplete="category"
                    helperText={errors.category}
                    value={this.state.selectedCategory}
                    onChange={this.handleCategorySelectChange}
                  >
                    {this.renderCategoryOptions()}
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    id="amount"
                    label="Amount"
                    name="amount"
                    autoComplete="amount"
                    helperText={errors.amount}
                    value={this.state.amount}
                    error={errors.amount ? true : false}
                    onChange={this.handleChange}
                  />
                </Grid>
              </Grid>
            </form>
          </Dialog>

          <Paper className="container">
            <Table aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell align="right">Date</TableCell>
                  <TableCell align="right">Owner</TableCell>
                  <TableCell align="right">Description</TableCell>
                  <TableCell align="right">Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.selectedPayments.map((payment) => (
                  <TableRow>
                    <TableCell align="right">
                      {new Date(payment.TransactionDate).toLocaleDateString(
                        "en-US"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {this.state.owners.length > 0
                        ? this.state.owners.find(
                            (x) => x.ownerId == payment.TransactionBy
                          ).ownerName
                        : ""}
                    </TableCell>
                    <TableCell align="right">{payment.Description}</TableCell>
                    <TableCell align="right">
                      {this.state.categories.length > 0
                        ? this.state.categories.find(
                            (x) => x.collectionId == payment.Category
                          ).collectionName
                        : ""}
                    </TableCell>
                    <TableCell align="right">{payment.Amount}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => this.deleteTodoHandler({ payment })}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Dialog
            onClose={handleViewClose}
            aria-labelledby="customized-dialog-title"
            open={viewOpen}
            fullWidth
            classes={{ paperFullWidth: classes.dialogeStyle }}
          >
            <DialogTitle id="customized-dialog-title" onClose={handleViewClose}>
              {this.state.title}
            </DialogTitle>
            <DialogContent dividers>
              <TextField
                fullWidth
                id="todoDetails"
                name="body"
                multiline
                readonly
                rows={1}
                rowsMax={25}
                value={this.state.body}
                InputProps={{
                  disableUnderline: true,
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    }
  }
}

export default withStyles(styles)(todo);
