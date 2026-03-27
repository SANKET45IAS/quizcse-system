const algorithms = require("./algorithms");
const compilerDesign = require("./compilerDesign");
const computerNetworks = require("./computerNetworks");
const computerOrganizationAndArchitecture = require("./computerOrganizationAndArchitecture");
const databasesDBMS = require("./databasesDBMS");
const digitalLogic = require("./digitalLogic");
const discreteMathematics = require("./discreteMathematics");
const engineeringMathematics = require("./engineeringMathematics");
const generalAptitude = require("./generalAptitude");
const legacyQuestion = require("./legacyQuestion");
const operatingSystems = require("./operatingSystems");
const programmingAndDataStructures = require("./programmingAndDataStructures");
const theoryOfComputation = require("./theoryOfComputation");

const SUBJECT_MODELS = [
  { topic: "General Aptitude", model: generalAptitude },
  { topic: "Engineering Mathematics", model: engineeringMathematics },
  { topic: "Discrete Mathematics", model: discreteMathematics },
  { topic: "Digital Logic", model: digitalLogic },
  {
    topic: "Computer Organization and Architecture",
    model: computerOrganizationAndArchitecture,
  },
  {
    topic: "Programming and Data Structures",
    model: programmingAndDataStructures,
  },
  { topic: "Algorithms", model: algorithms },
  { topic: "Theory of Computation", model: theoryOfComputation },
  { topic: "Compiler Design", model: compilerDesign },
  { topic: "Operating Systems", model: operatingSystems },
  { topic: "Databases (DBMS)", model: databasesDBMS },
  { topic: "Computer Networks", model: computerNetworks },
];

const normalizeTopicKey = (topic) =>
  String(topic || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const TOPIC_MODEL_MAP = new Map(SUBJECT_MODELS.map(({ topic, model }) => [topic, model]));

const NORMALIZED_TOPIC_MODEL_MAP = new Map(
  SUBJECT_MODELS.map(({ topic, model }) => [normalizeTopicKey(topic), model])
);

const getQuestionModel = (topic) =>
  TOPIC_MODEL_MAP.get(String(topic || "").trim()) || NORMALIZED_TOPIC_MODEL_MAP.get(normalizeTopicKey(topic)) || null;

const listQuestionModels = () => SUBJECT_MODELS.map(({ model }) => model);

module.exports = {
  getLegacyQuestionModel: () => legacyQuestion,
  getQuestionModel,
  listQuestionModels,
  normalizeTopicKey,
  subjectModels: SUBJECT_MODELS,
};
